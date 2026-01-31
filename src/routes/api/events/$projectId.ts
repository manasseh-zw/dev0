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
            let isClosed = false

            const unsubscribe = executionBus.subscribe(projectId, (event) => {
              if (isClosed) return
              
              try {
                const data = `data: ${JSON.stringify(event)}\n\n`
                controller.enqueue(encoder.encode(data))
              } catch (error) {
                // Controller was closed, stop trying to enqueue
                isClosed = true
                console.log(`[SSE] Stream closed for project ${projectId}`)
              }
            })

            // Store for cleanup
            ;(controller as { _cleanup?: () => void })._cleanup = () => {
              isClosed = true
              unsubscribe()
            }
          },
          cancel(controller) {
            ;(controller as { _cleanup?: () => void })._cleanup?.()
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
