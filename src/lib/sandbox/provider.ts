import { getDaytonaClient } from '@/lib/sandbox/client'
import { getTemplate } from '@/lib/templates'
import { env } from '@/lib/env'
import { db } from '@/lib/db'
import { projects, sandboxes } from '@/lib/db/schema'
import type {
  CreateSandboxConfig,
  SandboxInstance,
  ExecuteCommandOptions,
  CommandResult,
  GeminiExecOptions,
  StreamingCommandOptions,
  StreamingCallbacks,
} from '@/lib/types'
import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const SNAPSHOT_NAME = 'dev0-universal'

export async function createSandbox(
  config: CreateSandboxConfig,
): Promise<SandboxInstance> {
  const daytona = getDaytonaClient()
  const template = getTemplate(config.techStack)

  const sandbox = await daytona.create({
    snapshot: SNAPSHOT_NAME,
  })

  const envVars = {
    GITHUB_TOKEN: env.GITHUB_TOKEN,
    ...config.envVars,
  }

  for (const [key, value] of Object.entries(envVars)) {
    await sandbox.process.executeCommand(`export ${key}="${value}"`)
  }

  const cloneResult = await sandbox.process.executeCommand(
    `git clone ${template.repoUrl} /home/daytona/workspace/project && cd /home/daytona/workspace/project`,
  )

  if (cloneResult.exitCode !== 0) {
    await daytona.delete(sandbox)
    throw new Error(`Failed to clone template: ${cloneResult.result}`)
  }

  const [dbSandbox] = await db
    .insert(sandboxes)
    .values({
      daytonaId: sandbox.id,
      projectId: config.projectId,
      taskId: config.taskId ?? null,
      status: 'READY',
      snapshotId: SNAPSHOT_NAME,
    })
    .returning()

  if (!dbSandbox) {
    throw new Error('Failed to persist sandbox')
  }

  return {
    id: dbSandbox.id,
    daytonaId: sandbox.id,
    status: 'ready',
    publicUrl: undefined,
  }
}

export async function getOrCreateProjectSandbox(
  projectId: string,
  taskId?: string,
): Promise<SandboxInstance> {
  const existing = await db
    .select()
    .from(sandboxes)
    .where(
      and(eq(sandboxes.projectId, projectId), eq(sandboxes.status, 'READY')),
    )
    .limit(1)

  if (existing[0]) {
    const daytona = getDaytonaClient()
    try {
      await daytona.get(existing[0].daytonaId)

      if (taskId && existing[0].taskId !== taskId) {
        await db
          .update(sandboxes)
          .set({ taskId })
          .where(eq(sandboxes.id, existing[0].id))
      }

      return {
        id: existing[0].id,
        daytonaId: existing[0].daytonaId,
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

  const project = await getProjectRecord(projectId)

  return createSandbox({
    projectId,
    techStack: project.techStack as CreateSandboxConfig['techStack'],
    taskId,
  })
}

export async function executeCommand(
  sandboxId: string,
  command: string,
  options?: ExecuteCommandOptions,
): Promise<CommandResult> {
  const daytona = getDaytonaClient()
  const dbSandbox = await getSandboxRecord(sandboxId)

  const sandbox = await daytona.get(dbSandbox.daytonaId)

  const fullCommand = options?.cwd ? `cd ${options.cwd} && ${command}` : command

  const startTime = Date.now()

  const response = await sandbox.process.executeCommand(fullCommand)

  if (options?.onOutput) {
    options.onOutput(response.result)
  }

  const duration = Date.now() - startTime

  return {
    exitCode: response.exitCode,
    stdout: response.result,
    stderr: response.exitCode !== 0 ? response.result : '',
    duration,
  }
}

export async function executeCommandStreaming(
  sandboxId: string,
  command: string,
  options?: StreamingCommandOptions,
): Promise<CommandResult> {
  const daytona = getDaytonaClient()
  const dbSandbox = await getSandboxRecord(sandboxId)

  const sandbox = await daytona.get(dbSandbox.daytonaId)

  const fullCommand = options?.cwd ? `cd ${options.cwd} && ${command}` : command

  const startTime = Date.now()
  const sessionId = `exec-${randomUUID()}`

  await sandbox.process.createSession(sessionId)

  try {
    const response = await sandbox.process.executeSessionCommand(
      sessionId,
      { command: fullCommand, runAsync: true },
      options?.timeout,
    )

    const cmdId = response.cmdId ?? (response as { cmd_id?: string }).cmd_id
    if (!cmdId) {
      throw new Error('Failed to start session command')
    }

    let stdout = ''
    let stderr = ''

    await sandbox.process.getSessionCommandLogs(
      sessionId,
      cmdId,
      (chunk) => {
        stdout += chunk
        options?.onStdout?.(chunk)
        options?.onOutput?.(chunk)
      },
      (chunk) => {
        stderr += chunk
        options?.onStderr?.(chunk)
        options?.onOutput?.(chunk)
      },
    )

    const commandInfo = await sandbox.process.getSessionCommand(
      sessionId,
      cmdId,
    )
    const exitCode =
      (commandInfo as { exitCode?: number }).exitCode ??
      (commandInfo as { exit_code?: number }).exit_code ??
      response.exitCode ??
      0

    options?.onComplete?.(exitCode)

    const duration = Date.now() - startTime

    return {
      exitCode,
      stdout,
      stderr,
      duration,
    }
  } finally {
    try {
      await sandbox.process.deleteSession(sessionId)
    } catch (error) {
      // Best-effort cleanup; avoid masking the original error.
    }
  }
}

export async function executeGemini(
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

  const geminiCmd = [
    'gemini',
    yolo ? '--yolo' : '',
    `--model ${model}`,
    `-p "${prompt.replace(/"/g, '\\"')}"`,
  ]
    .filter(Boolean)
    .join(' ')

  return executeCommand(sandboxId, geminiCmd, { cwd, onOutput })
}

export async function executeGeminiStreaming(
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

  const geminiCmd = [
    'gemini',
    yolo ? '--yolo' : '',
    `--model ${model}`,
    `-p "${prompt.replace(/"/g, '\\"')}"`,
  ]
    .filter(Boolean)
    .join(' ')

  return executeCommandStreaming(sandboxId, geminiCmd, {
    cwd,
    onOutput,
    onStdout: callbacks?.onStdout,
    onStderr: callbacks?.onStderr,
    onComplete: callbacks?.onComplete,
  })
}

export async function stopSandbox(sandboxId: string): Promise<void> {
  const daytona = getDaytonaClient()

  const dbSandbox = await getSandboxRecord(sandboxId)

  const sandbox = await daytona.get(dbSandbox.daytonaId)
  await daytona.stop(sandbox)

  await db
    .update(sandboxes)
    .set({ status: 'STOPPED' })
    .where(eq(sandboxes.id, sandboxId))
}

export async function deleteSandbox(sandboxId: string): Promise<void> {
  const daytona = getDaytonaClient()

  const dbSandbox = await getSandboxRecord(sandboxId)

  const sandbox = await daytona.get(dbSandbox.daytonaId)
  await daytona.delete(sandbox)

  await db.delete(sandboxes).where(eq(sandboxes.id, sandboxId))
}

export async function getSandbox(sandboxId: string): Promise<SandboxInstance> {
  const dbSandbox = await getSandboxRecord(sandboxId)

  return {
    id: dbSandbox.id,
    daytonaId: dbSandbox.daytonaId,
    status: dbSandbox.status.toLowerCase() as SandboxInstance['status'],
    publicUrl: dbSandbox.publicUrl ?? undefined,
  }
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
