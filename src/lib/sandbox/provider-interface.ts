import type {
  CommandResult,
  CreateSandboxConfig,
  ExecuteCommandOptions,
  GeminiExecOptions,
  SandboxInstance,
  StreamingCallbacks,
  StreamingCommandOptions,
} from '@/lib/types'

export type SandboxFileType = 'file' | 'dir'

export type SandboxFileEntry = {
  name: string
  path: string
  type: SandboxFileType
  size?: number
}

export type SandboxProvider = {
  createSandbox(config: CreateSandboxConfig): Promise<SandboxInstance>
  getOrCreateProjectSandbox(
    projectId: string,
    taskId?: string,
  ): Promise<SandboxInstance>
  executeCommand(
    sandboxId: string,
    command: string,
    options?: ExecuteCommandOptions,
  ): Promise<CommandResult>
  executeCommandStreaming(
    sandboxId: string,
    command: string,
    options?: StreamingCommandOptions,
  ): Promise<CommandResult>
  executeGemini(
    sandboxId: string,
    options: GeminiExecOptions,
  ): Promise<CommandResult>
  executeGeminiStreaming(
    sandboxId: string,
    options: GeminiExecOptions,
    callbacks?: StreamingCallbacks,
  ): Promise<CommandResult>
  startDevServer(sandboxId: string, command: string): Promise<void>
  getPreviewUrl(sandboxId: string, port: number): Promise<string>
  listFiles(
    sandboxId: string,
    rootPath: string,
    options?: { depth?: number },
  ): Promise<SandboxFileEntry[]>
  readFile(sandboxId: string, path: string): Promise<string>
  stopSandbox(sandboxId: string): Promise<void>
  deleteSandbox(sandboxId: string): Promise<void>
  getSandbox(sandboxId: string): Promise<SandboxInstance>
}
