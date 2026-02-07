import { createFileRoute } from '@tanstack/react-router'
import { handle } from '@upstash/realtime'
import { realtime } from '@/lib/realtime/server'
import { getExecutionChannel } from '@/lib/realtime/schema'

const handler = handle({ realtime })

export const Route = createFileRoute('/api/events/$projectId')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url)
        url.searchParams.append('channel', getExecutionChannel(params.projectId))
        const response = await handler(new Request(url, request))
        return response ?? new Response('Missing channel', { status: 400 })
      },
    },
  },
})
