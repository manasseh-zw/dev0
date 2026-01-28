import type { TechStack } from '@/lib/templates'

export type CreateSandboxConfig = {
  projectId: string
  techStack: TechStack
  taskId?: string
  envVars?: Record<string, string>
}

export type SandboxInstance = {
  id: string
  daytonaId: string
  status: 'ready' | 'running' | 'stopped' | 'error'
  publicUrl?: string
}

export type ExecuteCommandOptions = {
  cwd?: string
  timeout?: number
  onOutput?: (data: string) => void
}

export type StreamingCallbacks = {
  onStdout?: (data: string) => void
  onStderr?: (data: string) => void
  onComplete?: (exitCode: number) => void
}

export type StreamingCommandOptions = ExecuteCommandOptions & StreamingCallbacks

export type CommandResult = {
  exitCode: number
  stdout: string
  stderr: string
  duration: number
}

export type GeminiExecOptions = {
  prompt: string
  model?: string
  yolo?: boolean
  cwd?: string
  onOutput?: (data: string) => void
}

export type TaskExecutionContext = {
  taskId: string
  title: string
  description: string
  repoUrl: string
  branch: string
  previousContext?: string
  maxAttempts: number
  attempt: number
}

export type TaskExecutionResult = {
  success: boolean
  prUrl?: string
  error?: string
  logs: TaskLog[]
  notes?: string
}

export type TaskLog = {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  meta?: Record<string, unknown>
}

export type SandboxEvent =
  | { type: 'created'; sandboxId: string; daytonaId: string }
  | { type: 'ready'; sandboxId: string }
  | { type: 'command_start'; sandboxId: string; command: string }
  | { type: 'command_output'; sandboxId: string; output: string }
  | { type: 'command_end'; sandboxId: string; exitCode: number }
  | { type: 'stopped'; sandboxId: string }
  | { type: 'error'; sandboxId: string; error: string }
