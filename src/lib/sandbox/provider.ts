import { getDaytonaClient } from '@/lib/sandbox/client'
import { getTemplate } from '@/lib/templates'
import { env } from '@/lib/env'
import { db } from '@/lib/db'
import { sandboxes } from '@/lib/db/schema'
import type {
  CreateSandboxConfig,
  SandboxInstance,
  ExecuteCommandOptions,
  CommandResult,
  GeminiExecOptions,
} from '@/lib/types'
import { eq } from 'drizzle-orm'

const SNAPSHOT_NAME = 'dev0-universal'

export async function createSandbox(
  config: CreateSandboxConfig
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
    `git clone ${template.repoUrl} /home/daytona/workspace/project && cd /home/daytona/workspace/project`
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

export async function executeCommand(
  sandboxId: string,
  command: string,
  options?: ExecuteCommandOptions
): Promise<CommandResult> {
  const daytona = getDaytonaClient()
  const dbSandbox = await getSandboxRecord(sandboxId)

  const sandbox = await daytona.get(dbSandbox.daytonaId)

  const fullCommand = options?.cwd
    ? `cd ${options.cwd} && ${command}`
    : command

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

export async function executeGemini(
  sandboxId: string,
  options: GeminiExecOptions
): Promise<CommandResult> {
  const { prompt, model = 'gemini-3-pro-preview', yolo = true, cwd, onOutput } = options

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
