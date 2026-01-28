'use client'

import { ChatWelcomeScreen } from '@/components/landing'
import { GridPattern } from '@/components/ui/grid-pattern'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { getPreview } from '@/lib/actions'
import { appStore, appActions } from '@/lib/state'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const navigate = useNavigate()
  const message = useStore(appStore, (state) => state.vibeInput)
  const isGeneratingPreview = useStore(
    appStore,
    (state) => state.isGeneratingPreview,
  )

  const handleSend = async () => {
    if (!message.trim()) {
      return
    }

    try {
      appActions.setGeneratingPreview(true)

      const previewData = await getPreview({ data: { vibeInput: message } })

      appActions.setPreviewData(previewData)

      navigate({ to: '/new' })
    } catch (error) {
      console.error('Error generating preview:', error)
      alert('Failed to generate preview. Please try again.')
      appActions.setGeneratingPreview(false)
    }
  }

  return (
    <main className="h-screen w-screen bg-background overflow-hidden flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <GridPattern className="pointer-events-none" />

        <div className="relative z-10 h-full">
          <div className="absolute right-4 top-4">
            <ThemeSwitcher />
          </div>
          <ChatWelcomeScreen
            message={message}
            onMessageChange={appActions.setVibeInput}
            onSend={handleSend}
            isGeneratingPreview={isGeneratingPreview}
          />
        </div>
      </div>
    </main>
  )
}
