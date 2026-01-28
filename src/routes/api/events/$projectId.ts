import { createFileRoute } from '@tanstack/react-router'
import { executionBus } from '@/lib/execution/event-bus'

export const Route = createFileRoute('/api/events/$projectId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { projectId } = params

        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder()

            const unsubscribe = executionBus.subscribe(projectId, (event) => {
              const data = `data: ${JSON.stringify(event)}\n\n`
              controller.enqueue(encoder.encode(data))
            })

            ;(controller as { _unsubscribe?: () => void })._unsubscribe =
              unsubscribe
          },
          cancel(controller) {
            ;(controller as { _unsubscribe?: () => void })._unsubscribe?.()
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      },
    },
  },
})
