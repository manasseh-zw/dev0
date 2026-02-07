import type {
  CommandResult,
  CreateSandboxConfig,
  ExecuteCommandOptions,
  GeminiExecOptions,
  SandboxInstance,
  StreamingCallbacks,
  StreamingCommandOptions,
} from '@/lib/types'
import type { SandboxFileEntry } from '@/lib/sandbox/provider-interface'
import { getSandboxProvider } from '@/lib/sandbox/providers'

const provider = getSandboxProvider()

export async function createSandbox(
  config: CreateSandboxConfig,
): Promise<SandboxInstance> {
  return provider.createSandbox(config)
}

export async function getOrCreateProjectSandbox(
  projectId: string,
  taskId?: string,
): Promise<SandboxInstance> {
  return provider.getOrCreateProjectSandbox(projectId, taskId)
}

export async function executeCommand(
  sandboxId: string,
  command: string,
  options?: ExecuteCommandOptions,
): Promise<CommandResult> {
  return provider.executeCommand(sandboxId, command, options)
}

export async function executeCommandStreaming(
  sandboxId: string,
  command: string,
  options?: StreamingCommandOptions,
): Promise<CommandResult> {
  return provider.executeCommandStreaming(sandboxId, command, options)
}

export async function executeGemini(
  sandboxId: string,
  options: GeminiExecOptions,
): Promise<CommandResult> {
  return provider.executeGemini(sandboxId, options)
}

export async function executeGeminiStreaming(
  sandboxId: string,
  options: GeminiExecOptions,
  callbacks?: StreamingCallbacks,
): Promise<CommandResult> {
  return provider.executeGeminiStreaming(sandboxId, options, callbacks)
}

export async function startDevServer(
  sandboxId: string,
  command: string,
): Promise<void> {
  return provider.startDevServer(sandboxId, command)
}

export async function getPreviewUrl(
  sandboxId: string,
  port: number,
): Promise<string> {
  return provider.getPreviewUrl(sandboxId, port)
}

export async function listFiles(
  sandboxId: string,
  rootPath: string,
  options?: { depth?: number },
): Promise<SandboxFileEntry[]> {
  return provider.listFiles(sandboxId, rootPath, options)
}

export async function readFile(
  sandboxId: string,
  path: string,
): Promise<string> {
  return provider.readFile(sandboxId, path)
}

export async function stopSandbox(sandboxId: string): Promise<void> {
  return provider.stopSandbox(sandboxId)
}

export async function deleteSandbox(sandboxId: string): Promise<void> {
  return provider.deleteSandbox(sandboxId)
}

export async function getSandbox(sandboxId: string): Promise<SandboxInstance> {
  return provider.getSandbox(sandboxId)
}
