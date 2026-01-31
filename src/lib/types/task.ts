import type { InferSelectModel } from 'drizzle-orm'
import { taskStatusEnum, tasks, taskLogs } from '@/lib/db/schema'
import type { GeminiStreamEvent } from '@/lib/types/gemini-stream'

export type Task = InferSelectModel<typeof tasks>
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number]
export type TaskExecutionLog = InferSelectModel<typeof taskLogs>

export type CreateTaskData = {
  projectId: string
  title: string
  description?: string
  phase: number
  order?: number
  dependencies?: string[]
}


export type TaskWithProject = Task & {
  project: {
    id: string
    name: string
    repoName: string | null
  }
}

/**
 * Task with pre-computed blocked status.
 * Computed server-side based on dependency status.
 * A task is blocked if it's PENDING and has any dependency that is not DONE.
 */
export type TaskWithBlocked = Task & {
  isBlocked: boolean
}

/**
 * Task with execution logs relation (for task details view).
 * Logs are lazy-loaded when viewing task details to avoid loading
 * large payloads when listing tasks.
 */
export type TaskWithLogs = Task & {
  executionLogs?: {
    id: string
    events: GeminiStreamEvent[]
    summary: string | null
    totalTokens: number | null
    durationMs: number | null
    toolCallsCount: number | null
  } | null
}

