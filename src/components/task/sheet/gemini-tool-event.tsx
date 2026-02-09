import type { GeminiToolUseEvent, GeminiToolResultEvent } from '@/lib/types/gemini-stream'
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
import { cn } from '@/lib/utils'

type ToolEvent = GeminiToolUseEvent | GeminiToolResultEvent

interface GeminiToolEventProps {
  event: ToolEvent
  className?: string
}

// Human-readable tool names
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

function formatToolName(name: string): string {
  if (toolNameMap[name]) {
    return toolNameMap[name]
  }
  // Convert snake_case to Title Case
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function GeminiToolEvent({ event, className }: GeminiToolEventProps) {
  if (event.type === 'tool_use') {
    return (
      <div className={cn('py-1', className)}>
        <Tool defaultOpen={false}>
          <ToolHeader
            type={`tool-${event.tool_name}`}
            state="input-available"
            title={formatToolName(event.tool_name)}
          />
          <ToolContent>
            <ToolInput input={event.parameters} />
          </ToolContent>
        </Tool>
      </div>
    )
  }

  // tool_result
  const state = event.status === 'success' ? 'output-available' : 'output-error'
  
  return (
    <div className={cn('py-1', className)}>
      <Tool defaultOpen={event.status === 'error'}>
        <ToolHeader
          type="tool-result"
          state={state}
          title="Result"
        />
        <ToolContent>
          <ToolOutput
            output={event.output}
            errorText={event.error}
          />
        </ToolContent>
      </Tool>
    </div>
  )
}
