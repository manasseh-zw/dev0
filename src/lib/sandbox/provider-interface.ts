import type {
  CommandResult,
  CreateSandboxConfig,
  ExecuteCommandOptions,
  GeminiExecOptions,
  SandboxInstance,
  StreamingCallbacks,
  StreamingCommandOptions,
} from '@/lib/types'

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
  stopSandbox(sandboxId: string): Promise<void>
  deleteSandbox(sandboxId: string): Promise<void>
  getSandbox(sandboxId: string): Promise<SandboxInstance>
}
