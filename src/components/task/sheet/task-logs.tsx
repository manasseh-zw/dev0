'use client'

import * as React from 'react'
import type { TaskWithLogs } from '@/lib/types/task'
import { useExecutionEvents, type ExecutionLogEntry } from '@/lib/hooks/use-execution-events'
import { cn } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { CommandLineIcon } from '@hugeicons/core-free-icons'
import { GeminiEventRenderer } from './gemini-event-renderer'
import type { GeminiStreamEvent } from '@/lib/types/gemini-stream'

interface TaskLogsProps {
  task: TaskWithLogs
  projectId?: string
  isRunning: boolean
  hasLogs: boolean
}

export function TaskLogs({ task, projectId, isRunning, hasLogs }: TaskLogsProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [liveLogs, setLiveLogs] = React.useState<ExecutionLogEntry[]>([])

  // Subscribe to live logs for running tasks
  const { logs: streamingLogs } = useExecutionEvents(
    isRunning ? projectId : undefined,
    {
      enabled: isRunning && Boolean(projectId),
      onLog: (entry) => {
        if (entry.taskId === task.id) {
          setLiveLogs((prev) => [...prev, entry])
        }
      },
    }
  )

  // Filter streaming logs for this specific task
  const taskLogs = React.useMemo(() => {
    return streamingLogs.filter((log) => log.taskId === task.id)
  }, [streamingLogs, task.id])

  // Combine live logs with streaming logs
  const allLiveLogs = React.useMemo(() => {
    const combined = [...liveLogs]
    for (const log of taskLogs) {
      if (!combined.some((l) => l.id === log.id)) {
        combined.push(log)
      }
    }
    return combined.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }, [liveLogs, taskLogs])

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
      {!isRunning && historicalEvents.map((event, index) => (
        <GeminiEventRenderer key={`hist-${index}`} event={event} />
      ))}

      {/* Show live logs for running tasks */}
      {isRunning && allLiveLogs.map((log) => (
        <div key={log.id}>
          {log.geminiEvent ? (
            <GeminiEventRenderer event={log.geminiEvent} />
          ) : (
            <LogLine
              timestamp={log.timestamp}
              level={log.stream === 'stderr' ? 'error' : 'info'}
              message={log.message}
            />
          )}
        </div>
      ))}

      {/* Running indicator */}
      {isRunning && allLiveLogs.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span>Waiting for logs...</span>
        </div>
      )}
    </div>
  )
}

function LogLine({
  timestamp,
  level,
  message,
}: {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
}) {
  const time = new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div
      className={cn(
        'flex gap-2 leading-relaxed font-mono text-xs',
        level === 'error' && 'text-red-500',
        level === 'warn' && 'text-amber-500',
        level === 'success' && 'text-green-500',
        level === 'info' && 'text-foreground'
      )}
    >
      <span className="text-muted-foreground shrink-0">{time}</span>
      <span className="break-all">{message}</span>
    </div>
  )
}
