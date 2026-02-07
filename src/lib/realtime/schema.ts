import { z } from 'zod'
import type { InferSchema } from '@upstash/realtime'

export const executionEventSchema = {
  execution: {
    task_started: z.object({
      projectId: z.string(),
      taskId: z.string(),
      sandboxId: z.string(),
    }),
    task_log: z.object({
      projectId: z.string(),
      taskId: z.string(),
      log: z.string(),
      stream: z.enum(['stdout', 'stderr']),
      geminiEvent: z.unknown().optional(),
    }),
    task_review: z.object({
      projectId: z.string(),
      taskId: z.string(),
      prUrl: z.string().optional(),
    }),
    task_failed: z.object({
      projectId: z.string(),
      taskId: z.string(),
      error: z.string(),
    }),
  },
}

export type RealtimeSchema = InferSchema<typeof executionEventSchema>

export type ExecutionTaskStartedPayload = z.infer<
  typeof executionEventSchema.execution.task_started
>
export type ExecutionTaskLogPayload = z.infer<
  typeof executionEventSchema.execution.task_log
>
export type ExecutionTaskReviewPayload = z.infer<
  typeof executionEventSchema.execution.task_review
>
export type ExecutionTaskFailedPayload = z.infer<
  typeof executionEventSchema.execution.task_failed
>

export type ExecutionRealtimeEventMap = {
  'execution.task_started': ExecutionTaskStartedPayload
  'execution.task_log': ExecutionTaskLogPayload
  'execution.task_review': ExecutionTaskReviewPayload
  'execution.task_failed': ExecutionTaskFailedPayload
}

export const getExecutionChannel = (projectId: string) =>
  `execution:${projectId}`
