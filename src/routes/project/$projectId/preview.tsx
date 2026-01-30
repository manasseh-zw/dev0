import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { HugeiconsIcon } from '@hugeicons/react'
import { ViewIcon, SourceCodeIcon } from '@hugeicons/core-free-icons'
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewConsole,
} from '@/components/ai-elements/web-preview'
import { CodeView } from '@/components/preview/code-view'

export const Route = createFileRoute('/project/$projectId/preview')({
  component: PreviewPage,
})

// Example console logs for demo
const exampleLogs = [
  {
    level: 'log' as const,
    message: 'Page loaded successfully',
    timestamp: new Date(Date.now() - 10_000),
  },
  {
    level: 'warn' as const,
    message: 'Deprecated API usage detected',
    timestamp: new Date(Date.now() - 5000),
  },
  {
    level: 'error' as const,
    message: 'Failed to load resource',
    timestamp: new Date(),
  },
]

function PreviewPage() {
  const [activeTab, setActiveTab] = useState('preview')
  
  // TODO: Replace with actual sandbox URL from project data
  const sandboxUrl = 'https://gemini3.com/'

  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 h-full">
        <WebPreview defaultUrl={sandboxUrl} className="flex flex-col flex-1 h-full rounded-none border-0">
          {/* Navigation bar with tabs */}
          <WebPreviewNavigation className="justify-end border-b border-border bg-background px-3 lg:px-6 py-3">
            <TabsList className="dark:bg-zinc-800/80">
              <TabsTrigger value="preview">
                <HugeiconsIcon icon={ViewIcon} size={16} />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code">
                <HugeiconsIcon icon={SourceCodeIcon} size={16} />
                Code
              </TabsTrigger>
            </TabsList>
          </WebPreviewNavigation>

          {/* Tab content */}
          <TabsContent value="preview" className="flex-1 overflow-hidden m-0 flex flex-col bg-card">
            <WebPreviewBody src={sandboxUrl || undefined} />
          </TabsContent>
          
          <TabsContent value="code" className="flex-1 overflow-hidden m-0">
            <CodeView />
          </TabsContent>
        </WebPreview>
      </Tabs>
    </div>
  )
}
