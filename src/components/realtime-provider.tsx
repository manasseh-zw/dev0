import type { ReactNode } from 'react'
import { RealtimeProvider } from '@upstash/realtime/client'

export function RealtimeClientProvider({
  children,
}: {
  children: ReactNode
}) {
  return <RealtimeProvider>{children}</RealtimeProvider>
}
