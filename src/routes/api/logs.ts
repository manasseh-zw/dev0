import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { taskLogs, tasks } from '@/lib/db/schema'
import type { GeminiStreamEvent } from '@/lib/types/gemini-stream'

type LogsPayload = {
  projectId?: string | null
  taskId: string
  runId?: string | null
  logsJsonl: string
  agentResult?: unknown
}

function parseLogsJsonl(raw: string): GeminiStreamEvent[] {
  if (!raw.trim()) return []
  const events: GeminiStreamEvent[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      events.push(JSON.parse(trimmed) as GeminiStreamEvent)
    } catch {
      continue
    }
  }
  return events
}

function summarizeEvents(events: GeminiStreamEvent[]): {
  summary?: string
  totalTokens?: number
  durationMs?: number
  toolCallsCount: number
} {
  const resultEvent = events.find((event) => event.type === 'result')
  const stats = resultEvent?.type === 'result' ? resultEvent.stats : undefined
  const lastMessage = [...events]
    .reverse()
    .find((event) => event.type === 'message' && event.role === 'assistant')

  return {
    summary:
      lastMessage?.type === 'message'
        ? lastMessage.content.slice(0, 2000)
        : undefined,
    totalTokens: stats?.total_tokens,
    durationMs: stats?.duration_ms,
    toolCallsCount: events.filter((event) => event.type === 'tool_use').length,
  }
}

export const Route = createFileRoute('/api/logs' as never)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json()) as LogsPayload

        if (!payload?.taskId) {
          return new Response('Missing taskId', { status: 400 })
        }

        if (!payload?.logsJsonl) {
          return new Response('Missing logsJsonl', { status: 400 })
        }

        const task = await db
          .select({ id: tasks.id, projectId: tasks.projectId })
          .from(tasks)
          .where(eq(tasks.id, payload.taskId))
          .limit(1)

        if (!task[0]) {
          return new Response('Task not found', { status: 404 })
        }

        if (payload.projectId && payload.projectId !== task[0].projectId) {
          return new Response('Project mismatch', { status: 400 })
        }

        const events = parseLogsJsonl(payload.logsJsonl)
        const { summary, totalTokens, durationMs, toolCallsCount } =
          summarizeEvents(events)

        await db
          .insert(taskLogs)
          .values({
            taskId: payload.taskId,
            events,
            summary,
            totalTokens: totalTokens ?? null,
            durationMs: durationMs ?? null,
            toolCallsCount,
          })
          .onConflictDoUpdate({
            target: taskLogs.taskId,
            set: {
              events,
              summary,
              totalTokens: totalTokens ?? null,
              durationMs: durationMs ?? null,
              toolCallsCount,
              updatedAt: new Date(),
            },
          })

        if (payload.agentResult) {
          await db
            .update(tasks)
            .set({
              logs: [payload.agentResult as {}],
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, payload.taskId))
        }

        return Response.json({ ok: true })
      },
    },
  },
})
