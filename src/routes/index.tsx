'use client'

import { ChatWelcomeScreen } from '@/components/landing'
import { GridPattern } from '@/components/ui/grid-pattern'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [message, setMessage] = useState('')
  const [selectedMode, setSelectedMode] = useState('fast')
  const [selectedModel, setSelectedModel] = useState('dev0-3')

  const handleSend = () => {
    if (message.trim()) {
      console.log('Sending message:', message)
      console.log('Mode:', selectedMode)
      console.log('Model:', selectedModel)
      // TODO: Implement actual send logic
      setMessage('')
    }
  }

  return (
    <main className="h-screen w-screen bg-background overflow-hidden flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <GridPattern className="pointer-events-none" />

        <div className="relative z-10 h-full">
          <ChatWelcomeScreen
            message={message}
            onMessageChange={setMessage}
            onSend={handleSend}
            selectedMode={selectedMode}
            onModeChange={setSelectedMode}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>
    </main>
  )
}
