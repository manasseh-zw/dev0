import { db } from '@/lib/db'
import { projects, sandboxes } from '@/lib/db/schema'
import { env } from '@/lib/env'
import {
  getE2bConnectionOpts,
  getE2bSandboxTimeoutMs,
} from '@/lib/sandbox/client'
import type { SandboxProvider } from '@/lib/sandbox/provider-interface'
import { getTemplate } from '@/lib/templates'
import type {
  CommandResult,
  CreateSandboxConfig,
  ExecuteCommandOptions,
  GeminiExecOptions,
  SandboxInstance,
  StreamingCallbacks,
  StreamingCommandOptions,
} from '@/lib/types'
import { CommandExitError, Sandbox } from 'e2b'
import { and, eq } from 'drizzle-orm'
import { globalLogger } from '@/lib/logging'

const DEFAULT_TEMPLATE = env.E2B_TEMPLATE
const SANDBOX_HOME = '$HOME'
const PROJECT_DIR = `${SANDBOX_HOME}/project`

function escapeForDoubleQuotes(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`')
}

function escapeForSingleQuotes(value: string): string {
  return value.replace(/'/g, `'\"'\"'`)
}

function buildProjectCloneUrl(project: {
  repoName?: string | null
  repoUrl?: string | null
}): string | null {
  if (project.repoName) {
    const owner = env.GITHUB_BOT_USERNAME
    return `https://github.com/${owner}/${project.repoName}.git`
  }

  if (project.repoUrl) {
    return project.repoUrl
  }

  return null
}

function withGithubToken(url: string, token?: string): string {
  if (!token) return url

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }

  if (parsed.hostname !== 'github.com') return url
  if (parsed.username || parsed.password) return url

  parsed.username = 'x-access-token'
  parsed.password = token

  return parsed.toString()
}

function redactSecret(value: string, secret?: string): string {
  if (!secret) return value
  if (!value) return value
  return value.split(secret).join('***')
}

function buildGeminiCommand(args: string[]): string {
  const safeArgs = args.filter(Boolean).join(' ')
  return `gemini ${safeArgs}`
}

function toCommandResult(
  result: { exitCode: number; stdout: string; stderr: string },
  startTime: number,
): CommandResult {
  return {
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    duration: Date.now() - startTime,
  }
}

async function connectSandbox(sandboxId: string) {
  return Sandbox.connect(sandboxId, {
    ...getE2bConnectionOpts(),
    timeoutMs: getE2bSandboxTimeoutMs(),
  })
}

async function getSandboxRecord(sandboxId: string) {
  const record = await db
    .select()
    .from(sandboxes)
    .where(eq(sandboxes.id, sandboxId))
    .limit(1)

  if (!record[0]) {
    throw new Error('Sandbox not found')
  }

  return record[0]
}

async function getProjectRecord(projectId: string) {
  const record = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)

  if (!record[0]) {
    throw new Error('Project not found')
  }

  return record[0]
}

export const e2bProvider: SandboxProvider = {
  async createSandbox(config: CreateSandboxConfig): Promise<SandboxInstance> {
    const template = getTemplate(config.techStack)
    const project = await getProjectRecord(config.projectId)
    const projectCloneUrl = buildProjectCloneUrl(project)

    const envVars = {
      GITHUB_TOKEN: env.GITHUB_TOKEN,
      GH_TOKEN: env.GITHUB_TOKEN,
      GEMINI_API_KEY: env.AGENT_GEMINI_API_KEY,
      AGENT_GEMINI_API_KEY: env.AGENT_GEMINI_API_KEY,
      ...config.envVars,
    }

    const sandbox = await Sandbox.create(DEFAULT_TEMPLATE, {
      ...getE2bConnectionOpts(),
      timeoutMs: getE2bSandboxTimeoutMs(),
      envs: envVars,
      metadata: {
        projectId: config.projectId,
        ...(config.taskId ? { taskId: config.taskId } : {}),
      },
      allowInternetAccess: true,
    })

    const geminiSettings = JSON.stringify({
      selectedAuthType: 'gemini-api-key',
    })
    const geminiEnvContent = `GEMINI_API_KEY="${env.AGENT_GEMINI_API_KEY}"`

    await sandbox.commands.run(
      `mkdir -p "${SANDBOX_HOME}/.gemini" && printf '%s' '${escapeForSingleQuotes(
        geminiSettings,
      )}' > "${SANDBOX_HOME}/.gemini/settings.json" && printf '%s' '${escapeForSingleQuotes(
        geminiEnvContent,
      )}' > "${SANDBOX_HOME}/.gemini/.env"`,
    )

    const cloneSource = withGithubToken(
      projectCloneUrl ?? template.repoUrl,
      env.GITHUB_TOKEN,
    )

    let cloneResult: { exitCode: number; stdout: string; stderr: string }
    try {
      cloneResult = await sandbox.commands.run(
        `git clone '${escapeForSingleQuotes(cloneSource)}' "${PROJECT_DIR}"`,
        {
          envs: {
            GIT_TERMINAL_PROMPT: '0',
          },
        },
      )
    } catch (error) {
      if (error instanceof CommandExitError) {
        await sandbox.kill().catch(() => undefined)
        const stderr = redactSecret(error.stderr, env.GITHUB_TOKEN)
        throw new Error(`Failed to clone template: ${stderr}`)
      }
      throw error
    }

    if (cloneResult.exitCode !== 0) {
      await sandbox.kill().catch(() => undefined)
      const stderr = redactSecret(cloneResult.stderr, env.GITHUB_TOKEN)
      throw new Error(`Failed to clone template: ${stderr}`)
    }

    if (env.GITHUB_TOKEN) {
      const remoteUrl = withGithubToken(
        projectCloneUrl ?? template.repoUrl,
        env.GITHUB_TOKEN,
      )
      await sandbox.commands.run(
        `git -C "${PROJECT_DIR}" remote set-url origin '${escapeForSingleQuotes(
          remoteUrl,
        )}'`,
      )
    }

    await sandbox.commands.run(
      `mkdir -p ${PROJECT_DIR}/.gemini && echo '${escapeForSingleQuotes(
        geminiSettings,
      )}' > ${PROJECT_DIR}/.gemini/settings.json`,
    )

    const [dbSandbox] = await db
      .insert(sandboxes)
      .values({
        sandboxId: sandbox.sandboxId,
        projectId: config.projectId,
        taskId: config.taskId ?? null,
        status: 'READY',
        snapshotId: DEFAULT_TEMPLATE,
      })
      .returning()

    if (!dbSandbox) {
      throw new Error('Failed to persist sandbox')
    }

    return {
      id: dbSandbox.id,
      sandboxId: sandbox.sandboxId,
      status: 'ready',
      publicUrl: undefined,
    }
  },

  async getOrCreateProjectSandbox(
    projectId: string,
    taskId?: string,
  ): Promise<SandboxInstance> {
    globalLogger.info('sandbox', 'getOrCreateProjectSandbox', {
      projectId,
      taskId: taskId ?? 'none',
    })

    const existing = await db
      .select()
      .from(sandboxes)
      .where(
        and(eq(sandboxes.projectId, projectId), eq(sandboxes.status, 'READY')),
      )
      .limit(1)

    if (existing[0]) {
      globalLogger.info('sandbox', 'Found existing sandbox', {
        sandboxId: existing[0].id,
        e2bSandboxId: existing[0].sandboxId,
        taskId: existing[0].taskId,
      })
      try {
        await connectSandbox(existing[0].sandboxId)

        if (taskId && existing[0].taskId !== taskId) {
          await db
            .update(sandboxes)
            .set({ taskId })
            .where(eq(sandboxes.id, existing[0].id))
        }

        return {
          id: existing[0].id,
          sandboxId: existing[0].sandboxId,
          status: existing[0].status.toLowerCase() as SandboxInstance['status'],
          publicUrl: existing[0].publicUrl ?? undefined,
        }
      } catch (error) {
        await db
          .update(sandboxes)
          .set({ status: 'STOPPED' })
          .where(eq(sandboxes.id, existing[0].id))
      }
    }

    globalLogger.info('sandbox', 'Creating new sandbox', { projectId, taskId })
    const project = await getProjectRecord(projectId)

    return this.createSandbox({
      projectId,
      techStack: project.techStack as CreateSandboxConfig['techStack'],
      taskId,
    })
  },

  async executeCommand(
    sandboxId: string,
    command: string,
    options?: ExecuteCommandOptions,
  ): Promise<CommandResult> {
    const dbSandbox = await getSandboxRecord(sandboxId)
    const sandbox = await connectSandbox(dbSandbox.sandboxId)
    const fullCommand = options?.cwd
      ? `cd ${options.cwd} && ${command}`
      : command
    const wrappedCommand =
      options?.wrapBash === false
        ? fullCommand
        : `bash -lc '${escapeForSingleQuotes(fullCommand)}'`

    const startTime = Date.now()

    try {
      const response = await sandbox.commands.run(wrappedCommand, {
        timeoutMs: options?.timeout,
      })

      if (options?.onOutput) {
        if (response.stdout) {
          options.onOutput(response.stdout)
        }
        if (response.stderr) {
          options.onOutput(response.stderr)
        }
      }

      return toCommandResult(response, startTime)
    } catch (error) {
      if (error instanceof CommandExitError) {
        if (options?.onOutput) {
          if (error.stdout) {
            options.onOutput(error.stdout)
          }
          if (error.stderr) {
            options.onOutput(error.stderr)
          }
        }
        return toCommandResult(
          {
            exitCode: error.exitCode,
            stdout: error.stdout,
            stderr: error.stderr,
          },
          startTime,
        )
      }
      throw error
    }
  },

  async executeCommandStreaming(
    sandboxId: string,
    command: string,
    options?: StreamingCommandOptions,
  ): Promise<CommandResult> {
    const dbSandbox = await getSandboxRecord(sandboxId)

    globalLogger.debug('sandbox', 'executeCommandStreaming - connecting', {
      sandboxId,
      e2bSandboxId: dbSandbox.sandboxId,
      hasCwd: !!options?.cwd,
    })
    const sandbox = await connectSandbox(dbSandbox.sandboxId)
    globalLogger.debug('sandbox', 'Connected to sandbox, preparing command')

    const fullCommand = options?.cwd
      ? `cd ${options.cwd} && ${command}`
      : command
    const wrappedCommand =
      options?.wrapBash === false
        ? fullCommand
        : `bash -lc '${escapeForSingleQuotes(fullCommand)}'`
    const startTime = Date.now()

    let stdout = ''
    let stderr = ''

    try {
      const result = await sandbox.commands.run(wrappedCommand, {
        timeoutMs: options?.timeout ?? 600000,
        onStdout: (chunk) => {
          stdout += chunk
          options?.onStdout?.(chunk)
          options?.onOutput?.(chunk)
        },
        onStderr: (chunk) => {
          stderr += chunk
          options?.onStderr?.(chunk)
          options?.onOutput?.(chunk)
        },
      })

      options?.onComplete?.(result.exitCode)

      return {
        exitCode: result.exitCode,
        stdout,
        stderr,
        duration: Date.now() - startTime,
      }
    } catch (error) {
      if (error instanceof CommandExitError) {
        options?.onComplete?.(error.exitCode)
        return {
          exitCode: error.exitCode,
          stdout: error.stdout,
          stderr: error.stderr,
          duration: Date.now() - startTime,
        }
      }
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('unsupported compressed output')) {
        globalLogger.warn(
          'sandbox',
          'Streaming protocol error, returning partial output',
          {
            error: message,
            stdoutLength: stdout.length,
            stderrLength: stderr.length,
          },
        )
        options?.onComplete?.(0)
        return {
          exitCode: 0,
          stdout,
          stderr: stderr
            ? `${stderr}\n[stream-error] ${message}`
            : `[stream-error] ${message}`,
          duration: Date.now() - startTime,
        }
      }
      globalLogger.error('sandbox', 'Error in executeCommandStreaming', error)
      throw error
    }
  },

  async executeGemini(
    sandboxId: string,
    options: GeminiExecOptions,
  ): Promise<CommandResult> {
    const {
      prompt,
      model = 'gemini-3-pro-preview',
      yolo = true,
      cwd,
      onOutput,
    } = options

    const geminiArgs = [
      yolo ? '--yolo' : '',
      `--model ${model}`,
      `-p "${escapeForDoubleQuotes(prompt)}"`,
    ]

    const geminiCmd = [
      `GEMINI_API_KEY='${escapeForSingleQuotes(env.AGENT_GEMINI_API_KEY)}'`,
      buildGeminiCommand(geminiArgs),
    ]
      .filter(Boolean)
      .join(' ')

    return this.executeCommand(sandboxId, geminiCmd, {
      cwd,
      onOutput,
      wrapBash: false,
    })
  },

  async executeGeminiStreaming(
    sandboxId: string,
    options: GeminiExecOptions,
    callbacks?: StreamingCallbacks,
  ): Promise<CommandResult> {
    const {
      prompt,
      model = 'gemini-3-pro-preview',
      yolo = true,
      cwd,
      onOutput,
    } = options

    globalLogger.info('sandbox', 'executeGeminiStreaming', {
      model,
      cwd: cwd ?? 'default',
      promptLength: prompt.length,
      yolo,
    })

    const geminiArgs = [
      yolo ? '--yolo' : '',
      `--model ${model}`,
      '--output-format stream-json',
      `-p "${escapeForDoubleQuotes(prompt)}"`,
    ]

    const geminiCmd = [
      `GEMINI_API_KEY='${escapeForSingleQuotes(env.AGENT_GEMINI_API_KEY)}'`,
      'unset GOOGLE_CLOUD_PROJECT &&',
      'unset GOOGLE_CLOUD_PROJECT_ID &&',
      buildGeminiCommand(geminiArgs),
    ]
      .filter(Boolean)
      .join(' ')

    return this.executeCommandStreaming(sandboxId, geminiCmd, {
      cwd,
      onOutput,
      onStdout: callbacks?.onStdout,
      onStderr: callbacks?.onStderr,
      onComplete: callbacks?.onComplete,
      wrapBash: false,
    })
  },

  async stopSandbox(sandboxId: string): Promise<void> {
    const dbSandbox = await getSandboxRecord(sandboxId)
    const sandbox = await connectSandbox(dbSandbox.sandboxId)

    await sandbox.betaPause().catch(() => undefined)

    await db
      .update(sandboxes)
      .set({ status: 'STOPPED' })
      .where(eq(sandboxes.id, sandboxId))
  },

  async deleteSandbox(sandboxId: string): Promise<void> {
    const dbSandbox = await getSandboxRecord(sandboxId)
    const sandbox = await connectSandbox(dbSandbox.sandboxId)

    await sandbox.kill()

    await db.delete(sandboxes).where(eq(sandboxes.id, sandboxId))
  },

  async getSandbox(sandboxId: string): Promise<SandboxInstance> {
    const dbSandbox = await getSandboxRecord(sandboxId)

    return {
      id: dbSandbox.id,
      sandboxId: dbSandbox.sandboxId,
      status: dbSandbox.status.toLowerCase() as SandboxInstance['status'],
      publicUrl: dbSandbox.publicUrl ?? undefined,
    }
  },
}
