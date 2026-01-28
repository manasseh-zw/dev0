import * as React from 'react'
import type { ExecutionEvent } from '@/lib/execution/event-bus'

export type ExecutionLogEntry = {
  id: string
  timestamp: string
  taskId: string
  stream: 'stdout' | 'stderr'
  message: string
}

type UseExecutionEventsOptions = {
  enabled?: boolean
  maxLogs?: number
  maxEvents?: number
  onEvent?: (event: ExecutionEvent) => void
  onLog?: (entry: ExecutionLogEntry) => void
  onError?: (error: unknown) => void
}

type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'error' | 'closed'

const defaultOptions: Required<Pick<UseExecutionEventsOptions, 'enabled'>> = {
  enabled: true,
}

function createLogEntry(
  event: Extract<ExecutionEvent, { type: 'task_log' }>,
): ExecutionLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    taskId: event.taskId,
    stream: event.stream,
    message: event.log,
  }
}

export function useExecutionEvents(
  projectId?: string,
  options: UseExecutionEventsOptions = {},
) {
  const { enabled, maxLogs, maxEvents, onEvent, onLog, onError } = {
    ...defaultOptions,
    ...options,
  }
  const [events, setEvents] = React.useState<ExecutionEvent[]>([])
  const [logs, setLogs] = React.useState<ExecutionLogEntry[]>([])
  const [status, setStatus] = React.useState<ConnectionStatus>('idle')
  const eventSourceRef = React.useRef<EventSource | null>(null)
  const onEventRef = React.useRef<UseExecutionEventsOptions['onEvent']>(onEvent)
  const onLogRef = React.useRef<UseExecutionEventsOptions['onLog']>(onLog)
  const onErrorRef = React.useRef<UseExecutionEventsOptions['onError']>(onError)

  React.useEffect(() => {
    onEventRef.current = onEvent
    onLogRef.current = onLog
    onErrorRef.current = onError
  }, [onEvent, onLog, onError])

  React.useEffect(() => {
    if (!enabled || !projectId) {
      return
    }

    const eventSource = new EventSource(`/api/events/${projectId}`)
    eventSourceRef.current = eventSource
    setStatus('connecting')

    eventSource.onopen = () => {
      setStatus('open')
    }

    eventSource.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as ExecutionEvent
        setEvents((current) => {
          const next = [...current, event]
          if (maxEvents && next.length > maxEvents) {
            return next.slice(next.length - maxEvents)
          }
          return next
        })
        onEventRef.current?.(event)

        if (event.type === 'task_log') {
          const entry = createLogEntry(event)
          setLogs((current) => {
            const next = [...current, entry]
            if (maxLogs && next.length > maxLogs) {
              return next.slice(next.length - maxLogs)
            }
            return next
          })
          onLogRef.current?.(entry)
        }
      } catch (error) {
        onErrorRef.current?.(error)
      }
    }

    eventSource.onerror = (error) => {
      setStatus('error')
      onErrorRef.current?.(error)
      eventSource.close()
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
      setStatus('closed')
    }
  }, [enabled, projectId, maxLogs, maxEvents])

  const clear = React.useCallback(() => {
    setEvents([])
    setLogs([])
  }, [])

  const close = React.useCallback(() => {
    eventSourceRef.current?.close()
    eventSourceRef.current = null
    setStatus('closed')
  }, [])

  return {
    events,
    logs,
    status,
    clear,
    close,
  }
}
