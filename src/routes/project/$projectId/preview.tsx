import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { HugeiconsIcon } from '@hugeicons/react'
import { ViewIcon, SourceCodeIcon, ArrowReloadVerticalIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
} from '@/components/ai-elements/web-preview'
import { CodeView } from '@/components/preview/code-view'

export const Route = createFileRoute('/project/$projectId/preview')({
  component: PreviewPage,
})


function PreviewPage() {
  const [activeTab, setActiveTab] = useState('preview')
  
  // TODO: Replace with actual sandbox URL from project data
  const sandboxUrl = 'https://ui.shadcn.com/'

  const handleSync = () => {
    // TODO: Implement sandbox sync logic
    console.log('Syncing sandbox...')
  }

  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
      <Tabs value={activeTab}  onValueChange={setActiveTab} className="flex flex-col flex-1 h-full">
        <WebPreview defaultUrl={sandboxUrl} className="flex flex-col flex-1 h-full rounded-none border-0">
          {/* Navigation bar with tabs and sync button */}
          <WebPreviewNavigation className="justify-between border-b border-border bg-background px-3 lg:px-6 py-3 gap-3">
            <TabsList  className="dark:bg-background">
              <TabsTrigger  value="preview">
                <HugeiconsIcon icon={ViewIcon} size={16} />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code">
                <HugeiconsIcon icon={SourceCodeIcon} size={16} />
                Code
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" className="shadow-none gap-2" onClick={handleSync}>
              <HugeiconsIcon icon={ArrowReloadVerticalIcon} className="size-4" />
              Sync
            </Button>
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
