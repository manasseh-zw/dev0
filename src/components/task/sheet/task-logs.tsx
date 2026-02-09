import * as React from 'react'
import type { TaskWithLogs } from '@/lib/types/task'
import { HugeiconsIcon } from '@hugeicons/react'
import { CommandLineIcon } from '@hugeicons/core-free-icons'
import { GeminiEventRenderer } from './gemini-event-renderer'
import type { GeminiStreamEvent } from '@/lib/types/gemini-stream'
import { useRealtime } from '@/lib/realtime/client'
import { getExecutionChannel } from '@/lib/realtime/schema'
import { MAX_TASK_LOGS } from '@/lib/constants'

type ExecutionLogEntry = {
  id: string
  timestamp: string
  taskId: string
  stream: 'stdout' | 'stderr'
  message: string
  geminiEvent?: GeminiStreamEvent
}

interface TaskLogsProps {
  task: TaskWithLogs
  projectId?: string
  isRunning: boolean
  hasLogs: boolean
}

export function TaskLogs({
  task,
  projectId,
  isRunning,
  hasLogs,
}: TaskLogsProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [liveLogs, setLiveLogs] = React.useState<ExecutionLogEntry[]>([])
  const maxLogs = MAX_TASK_LOGS
  const shouldListen = isRunning && Boolean(projectId)
  const channel = shouldListen
    ? getExecutionChannel(projectId as string)
    : 'execution:disabled'

  useRealtime({
    channels: [channel],
    events: ['execution.task_log'],
    onData: (payload) => {
      if (!shouldListen) return
      const data = payload.data as {
        taskId: string
        log: string
        stream: 'stdout' | 'stderr'
        geminiEvent?: GeminiStreamEvent
      }
      if (data.taskId !== task.id) return

      const entry: ExecutionLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date().toISOString(),
        taskId: data.taskId,
        stream: data.stream,
        message: data.log,
        geminiEvent: data.geminiEvent,
      }
      setLiveLogs((prev) => {
        if (prev.length >= maxLogs) {
          return [...prev.slice(1), entry]
        }
        return [...prev, entry]
      })
    },
  })

  const allLiveLogs = React.useMemo(() => {
    return [...liveLogs].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }, [liveLogs])

  const liveEventLogs = React.useMemo(
    () => allLiveLogs.filter((log) => Boolean(log.geminiEvent)),
    [allLiveLogs],
  )

  // Auto-scroll to bottom when new logs arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [allLiveLogs, task.executionLogs])

  // Reset live logs when task changes
  React.useEffect(() => {
    setLiveLogs([])
  }, [task.id])

  // Historical Gemini events from task.executionLogs relation
  const historicalEvents: GeminiStreamEvent[] = task.executionLogs?.events ?? []

  // No logs state
  if (!isRunning && !hasLogs && historicalEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <HugeiconsIcon
            icon={CommandLineIcon}
            className="size-6 text-muted-foreground"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          No logs available for this task.
        </p>
        {task.status === 'PENDING' && (
          <p className="text-xs text-muted-foreground mt-1">
            Logs will appear once the task starts running.
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto bg-muted/30 rounded-lg p-4 space-y-1"
    >
      {/* Show historical Gemini events for completed tasks */}
      {!isRunning &&
        historicalEvents.map((event, index) => (
          <GeminiEventRenderer key={`hist-${index}`} event={event} />
        ))}

      {/* Show live logs for running tasks */}
      {isRunning &&
        liveEventLogs.map((log) => (
          <div key={log.id}>
            {log.geminiEvent ? (
              <GeminiEventRenderer event={log.geminiEvent} />
            ) : null}
          </div>
        ))}

      {/* Running indicator */}
      {isRunning && liveEventLogs.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span>Waiting for logs...</span>
        </div>
      )}
    </div>
  )
}
