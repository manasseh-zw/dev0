'use client'

import type { Task } from '@/lib/types'
import type { TaskWithLogs } from '@/lib/types/task'
import type { GeminiStreamEvent } from '@/lib/types/gemini-stream'
import { getMockExecutionLogs } from '@/data/mock/execution-logs'
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought'
import { GeminiToolEvent } from '@/components/task/sheet/gemini-tool-event'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Play,
  Wrench,
  XCircle,
} from 'lucide-react'

interface ActivityTabProps {
  task: Task | TaskWithLogs
}

// Get icon for event type
function getEventIcon(event: GeminiStreamEvent): LucideIcon {
  switch (event.type) {
    case 'init':
      return Play
    case 'message':
      return MessageSquare
    case 'tool_use':
    case 'tool_result':
      return Wrench
    case 'result':
      return event.status === 'success' ? CheckCircle2 : XCircle
    case 'error':
      return AlertTriangle
    default:
      return MessageSquare
  }
}

// Get heading for event type
function getEventHeading(event: GeminiStreamEvent): string {
  switch (event.type) {
    case 'init':
      return 'Session Started'
    case 'message':
      return event.role === 'user' ? 'User Message' : 'Agent Response'
    case 'tool_use':
      return `Tool: ${formatToolName(event.tool_name)}`
    case 'tool_result':
      return event.status === 'success' ? 'Tool Success' : 'Tool Error'
    case 'result':
      return event.status === 'success' ? 'Task Completed' : 'Task Failed'
    case 'error':
      return 'Error'
    default:
      return 'Event'
  }
}

// Format tool name to be human readable
function formatToolName(name: string): string {
  const toolNameMap: Record<string, string> = {
    read_file: 'Read File',
    write_file: 'Write File',
    edit_file: 'Edit File',
    list_directory: 'List Directory',
    run_command: 'Run Command',
    search_files: 'Search Files',
    google_web_search: 'Web Search',
    glob: 'Find Files',
    grep: 'Search Content',
    read_many_files: 'Read Files',
    shell: 'Shell Command',
  }
  if (toolNameMap[name]) {
    return toolNameMap[name]
  }
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Get dot status for event
export function ActivityTab({ task }: ActivityTabProps) {
  // Try to get execution logs from task or mock data
  const taskWithLogs = task as TaskWithLogs
  const mockLogs = getMockExecutionLogs(task.id)
  const events: GeminiStreamEvent[] =
    taskWithLogs.executionLogs?.events ?? mockLogs?.events ?? []

  // If no events, show empty state
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Play className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No activity logs available for this task.
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
    <div className="py-2">
      <ChainOfThought defaultOpen>
        <ChainOfThoughtHeader>Activity</ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          {events.map((event, index) => {
            const isLast = index === events.length - 1
            const isError =
              event.type === 'error' ||
              (event.type === 'result' && event.status === 'error')
            const timestamp = format(new Date(event.timestamp), 'h:mm:ss a')

            return (
              <ChainOfThoughtStep
                key={`event-${index}`}
                icon={getEventIcon(event)}
                status={isLast ? 'active' : 'complete'}
                label={
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'font-medium',
                        isError && 'text-destructive',
                      )}
                    >
                      {getEventHeading(event)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timestamp}
                    </span>
                  </div>
                }
              >
                {/* Render content based on event type */}
                {event.type === 'init' && (
                  <div className="text-sm text-muted-foreground">
                    Model:{' '}
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {event.model}
                    </code>
                  </div>
                )}

                {event.type === 'message' &&
                  (event.role === 'user' ? (
                    <div className="text-sm rounded-lg p-3 bg-muted/50 border-l-2 border-muted-foreground/30 italic text-muted-foreground">
                      <p className="whitespace-pre-wrap line-clamp-6">
                        {event.content}
                      </p>
                    </div>
                  ) : (
                    <Message from="assistant">
                      <MessageContent className="bg-background border border-border rounded-lg p-3">
                        <MessageResponse>{event.content}</MessageResponse>
                      </MessageContent>
                    </Message>
                  ))}

                {(event.type === 'tool_use' ||
                  event.type === 'tool_result') && (
                  <GeminiToolEvent event={event} />
                )}

                {event.type === 'result' && (
                  <div className="flex items-center gap-3 text-sm">
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        event.status === 'success'
                          ? 'bg-green-500'
                          : 'bg-red-500',
                      )}
                    />
                    <span className="font-medium">
                      {event.status === 'success' ? 'Completed' : 'Failed'}
                    </span>
                    {event.stats.duration_ms != null && (
                      <span className="text-muted-foreground">
                        {(event.stats.duration_ms / 1000).toFixed(1)}s
                      </span>
                    )}
                    {event.stats.tool_calls != null &&
                      event.stats.tool_calls > 0 && (
                        <span className="text-muted-foreground">
                          {event.stats.tool_calls} tool calls
                        </span>
                      )}
                  </div>
                )}

                {event.type === 'error' && (
                  <div className="text-sm text-destructive bg-destructive/5 px-3 py-2 rounded-md">
                    {event.message}
                    {event.code && (
                      <code className="ml-2 text-xs bg-destructive/10 px-1.5 py-0.5 rounded">
                        {event.code}
                      </code>
                    )}
                  </div>
                )}
              </ChainOfThoughtStep>
            )
          })}
        </ChainOfThoughtContent>
      </ChainOfThought>
    </div>
  )
}
