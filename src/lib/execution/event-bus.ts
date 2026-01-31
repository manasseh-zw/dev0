import { EventEmitter } from 'events'

export type ExecutionEvent =
  | {
      type: 'task_started'
      projectId: string
      taskId: string
      sandboxId: string
    }
  | {
      type: 'task_log'
      projectId: string
      taskId: string
      log: string
      stream: 'stdout' | 'stderr'
    }
  | {
      type: 'task_completed'
      projectId: string
      taskId: string
      prUrl?: string
    }
  | {
      type: 'task_failed'
      projectId: string
      taskId: string
      error: string
    }

class ExecutionEventBus extends EventEmitter {
  emit(event: ExecutionEvent): boolean
  emit(eventName: string | symbol, ...args: unknown[]): boolean
  emit(
    eventOrName: ExecutionEvent | string | symbol,
    ...args: unknown[]
  ): boolean {
    if (typeof eventOrName === 'object' && eventOrName) {
      const event = eventOrName
      if (event.type !== 'task_log') {
        // Log all events except logs (too noisy)
        console.log(`[EVENT_BUS] Emitting ${event.type} for project ${event.projectId}`)
      }
      return super.emit(event.projectId, event)
    }
    return super.emit(eventOrName, ...args)
  }

  subscribe(
    projectId: string,
    callback: (event: ExecutionEvent) => void,
  ): () => void {
    this.on(projectId, callback)
    return () => {
      this.off(projectId, callback)
    }
  }
}

export const executionBus = new ExecutionEventBus()
