/**
 * Gemini CLI Streaming JSON Event Types
 *
 * These types represent the events emitted by `gemini --output-format stream-json`.
 * Each line of output is a JSON object with a `type` field.
 *
 * @see https://ai.google.dev/gemini-api/docs/cli/headless
 */

// Base event type with common fields
export interface GeminiBaseEvent {
  timestamp: string
}

// Session initialization event
export interface GeminiInitEvent extends GeminiBaseEvent {
  type: 'init'
  session_id: string
  model: string
}

// Message events (user prompts and assistant responses)
export interface GeminiMessageEvent extends GeminiBaseEvent {
  type: 'message'
  role: 'user' | 'assistant'
  content: string
  delta?: boolean // true for streaming incremental updates
}

// JSON-safe type for JSONB compatibility
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

// Tool use request event
export interface GeminiToolUseEvent extends GeminiBaseEvent {
  type: 'tool_use'
  tool_name: string
  tool_id: string
  parameters: Record<string, JsonValue>
}

// Tool execution result event
export interface GeminiToolResultEvent extends GeminiBaseEvent {
  type: 'tool_result'
  tool_id: string
  status: 'success' | 'error'
  output?: string
  error?: string
}

// Error event (non-fatal)
export interface GeminiErrorEvent extends GeminiBaseEvent {
  type: 'error'
  message: string
  code?: string
}

// Stats from the result event
export interface GeminiResultStats {
  total_tokens?: number
  input_tokens?: number
  output_tokens?: number
  duration_ms?: number
  tool_calls?: number
}

// Final result event with aggregated stats
export interface GeminiResultEvent extends GeminiBaseEvent {
  type: 'result'
  status: 'success' | 'error'
  stats: GeminiResultStats
}

// Union type for all Gemini stream events
export type GeminiStreamEvent =
  | GeminiInitEvent
  | GeminiMessageEvent
  | GeminiToolUseEvent
  | GeminiToolResultEvent
  | GeminiErrorEvent
  | GeminiResultEvent

// Type of events
export type GeminiEventType = GeminiStreamEvent['type']

// Type guard to check if a value is a valid Gemini stream event
export function isGeminiEvent(value: unknown): value is GeminiStreamEvent {
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    return false
  }
  const type = (value as { type: unknown }).type
  return (
    type === 'init' ||
    type === 'message' ||
    type === 'tool_use' ||
    type === 'tool_result' ||
    type === 'error' ||
    type === 'result'
  )
}

// Type guard for tool events
export function isToolEvent(
  event: GeminiStreamEvent,
): event is GeminiToolUseEvent | GeminiToolResultEvent {
  return event.type === 'tool_use' || event.type === 'tool_result'
}

// Type guard for message events
export function isMessageEvent(
  event: GeminiStreamEvent,
): event is GeminiMessageEvent {
  return event.type === 'message'
}
