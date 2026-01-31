'use client'

import type { GeminiStreamEvent } from '@/lib/types/gemini-stream'
import { GeminiToolEvent } from '@/components/task/sheet/gemini-tool-event'
import { cn } from '@/lib/utils'

interface GeminiEventRendererProps {
  event: GeminiStreamEvent
  className?: string
}

export function GeminiEventRenderer({ event, className }: GeminiEventRendererProps) {
  switch (event.type) {
    case 'init':
      return (
        <div className={cn('flex items-center gap-2 text-xs text-muted-foreground py-2', className)}>
          <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>Session started</span>
          <span className="text-muted-foreground/50">·</span>
          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{event.model}</code>
        </div>
      )
    
    case 'message':
      if (event.role === 'user') {
        return (
          <div className={cn('py-2 text-sm text-muted-foreground italic border-l-2 border-muted pl-3 my-1', className)}>
            {event.content}
          </div>
        )
      }
      // Assistant message
      return (
        <div className={cn('py-2 text-sm whitespace-pre-wrap', className)}>
          {event.content}
        </div>
      )
    
    case 'tool_use':
    case 'tool_result':
      return <GeminiToolEvent event={event} className={className} />
    
    case 'error':
      return (
        <div className={cn('flex items-center gap-2 text-sm text-destructive py-2 bg-destructive/5 px-3 rounded-md my-1', className)}>
          <span className="text-destructive shrink-0">⚠</span>
          <span className="flex-1">{event.message}</span>
          {event.code && (
            <code className="text-[10px] bg-destructive/10 px-1.5 py-0.5 rounded font-mono shrink-0">
              {event.code}
            </code>
          )}
        </div>
      )
    
    case 'result':
      return (
        <div className={cn('flex items-center gap-3 text-xs text-muted-foreground py-3 border-t border-border mt-3', className)}>
          <span className={cn(
            'size-2 rounded-full shrink-0',
            event.status === 'success' ? 'bg-green-500' : 'bg-red-500'
          )} />
          <span className="font-medium">
            {event.status === 'success' ? 'Completed' : 'Failed'}
          </span>
          {event.stats.duration_ms != null && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span>{(event.stats.duration_ms / 1000).toFixed(1)}s</span>
            </>
          )}
          {event.stats.tool_calls != null && event.stats.tool_calls > 0 && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span>{event.stats.tool_calls} tool calls</span>
            </>
          )}
          {event.stats.total_tokens != null && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span>{event.stats.total_tokens.toLocaleString()} tokens</span>
            </>
          )}
        </div>
      )
    
    default:
      return null
  }
}
