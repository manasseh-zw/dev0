import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import * as orchestrator from '@/lib/execution/orchestrator'

const startExecutionSchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
})

type StartExecutionInput = z.infer<typeof startExecutionSchema>

export const startExecution = createServerFn({ method: 'POST' })
  .inputValidator(startExecutionSchema)
  .handler(async ({ data }: { data: StartExecutionInput }) => {
    console.log(`[EXECUTION] startExecution called - projectId: ${data.projectId}, taskId: ${data.taskId ?? 'auto'}`)
    
    const result = await orchestrator.startTask(data.projectId, data.taskId)

    if (result.alreadyRunning) {
      console.log(`[EXECUTION] Task already running - taskId: ${result.taskId}`)
      return {
        success: false,
        message: 'A task is already running for this project',
        runningTaskId: result.taskId,
      }
    }

    console.log(`[EXECUTION] Task started successfully - taskId: ${result.taskId}, sandboxId: ${result.sandboxId}`)
    return {
      success: true,
      taskId: result.taskId,
      sandboxId: result.sandboxId,
    }
  })

const stopExecutionSchema = z.object({
  projectId: z.string(),
})

type StopExecutionInput = z.infer<typeof stopExecutionSchema>

export const stopExecution = createServerFn({ method: 'POST' })
  .inputValidator(stopExecutionSchema)
  .handler(async ({ data }: { data: StopExecutionInput }) => {
    return { success: false, message: 'Stop execution not implemented yet' }
  })
