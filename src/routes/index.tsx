import { createFileRoute } from '@tanstack/react-router'
import { LogoShowcase } from '@/components/logo'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <LogoShowcase />
    </main>
  )
}
