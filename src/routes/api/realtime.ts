import { createFileRoute } from '@tanstack/react-router'
import { handle } from '@upstash/realtime'
import { realtime } from '@/lib/realtime/server'

const handler = handle({ realtime })

export const Route = createFileRoute('/api/realtime')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const response = await handler(request)
        return response ?? new Response('Missing channel', { status: 400 })
      },
    },
  },
})
