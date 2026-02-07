import { createFileRoute } from '@tanstack/react-router'
import { executionBus } from '@/lib/execution/event-bus'

export const Route = createFileRoute('/api/events/$projectId')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { projectId } = params

        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder()
            let isClosed = false
            let heartbeatId: ReturnType<typeof setInterval> | null = null

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
              if (heartbeatId) {
                clearInterval(heartbeatId)
                heartbeatId = null
              }
              unsubscribe()
              try {
                controller.close()
              } catch {
                // no-op
              }
            }

            request.signal?.addEventListener(
              'abort',
              () => {
                ;(controller as { _cleanup?: () => void })._cleanup?.()
              },
              { once: true },
            )

            heartbeatId = setInterval(() => {
              if (isClosed) return
              try {
                controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'))
              } catch {
                isClosed = true
              }
            }, 15000)
          },
          cancel(controller) {
            ;(controller as { _cleanup?: () => void })._cleanup?.()
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          },
        })
      },
    },
  },
})
