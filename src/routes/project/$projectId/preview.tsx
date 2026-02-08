import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ViewIcon,
  SourceCodeIcon,
  ArrowReloadVerticalIcon,
  Loading03Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
} from '@/components/ai-elements/web-preview'
import { CodeView } from '@/components/preview/code-view'
import {
  getProjectFileContent,
  getProjectFileContents,
  getProjectFileTree,
  resetProjectPreview,
  startProjectPreview,
} from '@/lib/actions'

export const Route = createFileRoute('/project/$projectId/preview')({
  component: PreviewPage,
})

type PreviewCache = {
  sandboxUrl?: string
  fileTree: import('@/lib/actions').FileTreeNode[]
  fileContents: Record<string, string>
  truncated: Record<string, boolean>
  initialized: boolean
  lastUpdated: number
}

const PREVIEW_CACHE_KEY = 'preview-cache-v1'

function loadPreviewCache(projectId: string): PreviewCache | null {
  if (typeof window === 'undefined') return null
  const raw = window.sessionStorage.getItem(PREVIEW_CACHE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, PreviewCache>
    return parsed[projectId] ?? null
  } catch {
    return null
  }
}

function savePreviewCache(projectId: string, cache: PreviewCache) {
  if (typeof window === 'undefined') return
  const raw = window.sessionStorage.getItem(PREVIEW_CACHE_KEY)
  const store: Record<string, PreviewCache> = raw ? JSON.parse(raw) : {}
  store[projectId] = cache
  window.sessionStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(store))
}

function clearPreviewCache(projectId: string) {
  if (typeof window === 'undefined') return
  const raw = window.sessionStorage.getItem(PREVIEW_CACHE_KEY)
  if (!raw) return
  try {
    const store = JSON.parse(raw) as Record<string, PreviewCache>
    delete store[projectId]
    window.sessionStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(store))
  } catch {
    window.sessionStorage.removeItem(PREVIEW_CACHE_KEY)
  }
}

function PreviewPage() {
  const [activeTab, setActiveTab] = useState('preview')
  const { projectId } = Route.useParams()
  const [sandboxUrl, setSandboxUrl] = useState<string | undefined>(undefined)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [fileTree, setFileTree] = useState<
    import('@/lib/actions').FileTreeNode[]
  >([])
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [fileTruncated, setFileTruncated] = useState<Record<string, boolean>>(
    {},
  )
  const stepTimerRef = useRef<number | null>(null)
  const hydratedRef = useRef(false)

  const loadingSteps = [
    'Creating sandbox environment...',
    'Preparing workspace...',
    'Installing dependencies...',
    'Starting dev server...',
    'Fetching project files...',
  ]

  useEffect(() => {
    if (hydratedRef.current) return
    const cached = loadPreviewCache(projectId)
    if (cached) {
      setSandboxUrl(cached.sandboxUrl)
      setFileTree(cached.fileTree)
      setFileContents(cached.fileContents)
      setFileTruncated(cached.truncated)
      setIsInitialized(cached.initialized)
    }
    hydratedRef.current = true
  }, [projectId])

  const persistCache = (next?: Partial<PreviewCache>) => {
    const cache: PreviewCache = {
      sandboxUrl,
      fileTree,
      fileContents,
      truncated: fileTruncated,
      initialized: isInitialized,
      lastUpdated: Date.now(),
      ...next,
    }
    savePreviewCache(projectId, cache)
  }

  const loadPreview = async () => {
    const startTime = Date.now()
    setIsLoading(true)
    setPreviewError(null)
    setLoadingStep(0)
    if (stepTimerRef.current) {
      window.clearInterval(stepTimerRef.current)
    }
    stepTimerRef.current = window.setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, loadingSteps.length - 1))
    }, 1600)
    try {
      const preview = await startProjectPreview({ data: { projectId } })
      setSandboxUrl(preview.previewUrl)
      const tree = await getProjectFileTree({ data: { projectId } })
      setFileTree(tree)
      setIsInitialized(true)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load preview'
      setPreviewError(message)
    } finally {
      const elapsed = Date.now() - startTime
      const remaining = 5000 - elapsed
      if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining))
      }
      if (stepTimerRef.current) {
        window.clearInterval(stepTimerRef.current)
        stepTimerRef.current = null
      }
      setIsLoading(false)
    }
  }

  const resetPreview = async () => {
    const startTime = Date.now()
    setIsLoading(true)
    setPreviewError(null)
    setSandboxUrl(undefined)
    setFileTree([])
    setFileContents({})
    setFileTruncated({})
    setIsInitialized(false)
    clearPreviewCache(projectId)
    setLoadingStep(0)
    if (stepTimerRef.current) {
      window.clearInterval(stepTimerRef.current)
    }
    stepTimerRef.current = window.setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, loadingSteps.length - 1))
    }, 1600)

    try {
      const preview = await resetProjectPreview({ data: { projectId } })
      setSandboxUrl(preview.previewUrl)
      const tree = await getProjectFileTree({ data: { projectId } })
      setFileTree(tree)
      setIsInitialized(true)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to reset preview'
      setPreviewError(message)
    } finally {
      const elapsed = Date.now() - startTime
      const remaining = 5000 - elapsed
      if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining))
      }
      if (stepTimerRef.current) {
        window.clearInterval(stepTimerRef.current)
        stepTimerRef.current = null
      }
      setIsLoading(false)
    }
  }

  useEffect(() => {
    persistCache()
  }, [sandboxUrl, fileTree, fileContents, fileTruncated, isInitialized])

  const handleSync = () => {
    void resetPreview()
  }

  const readFile = useMemo(
    () => async (path: string) => {
      if (fileContents[path]) {
        return {
          content: fileContents[path],
          truncated: fileTruncated[path] ?? false,
        }
      }
      const result = await getProjectFileContent({ data: { projectId, path } })
      setFileContents((prev) => ({ ...prev, [path]: result.content }))
      setFileTruncated((prev) => ({ ...prev, [path]: result.truncated }))
      return result
    },
    [projectId, fileContents, fileTruncated],
  )

  const readFiles = useMemo(
    () => async (paths: string[]) => {
      const missing = paths.filter((path) => !fileContents[path])
      if (!missing.length) {
        return {
          files: fileContents,
          truncated: fileTruncated,
        }
      }
      const result = await getProjectFileContents({
        data: { projectId, paths: missing },
      })
      if (result) {
        setFileContents((prev) => ({ ...prev, ...result.files }))
        setFileTruncated((prev) => ({ ...prev, ...result.truncated }))
      }
      return result
    },
    [projectId, fileContents, fileTruncated],
  )

  const handleInitialize = () => {
    void loadPreview()
  }

  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 h-full"
      >
        <WebPreview
          defaultUrl={sandboxUrl}
          className="flex flex-col flex-1 h-full rounded-none border-0"
        >
          {/* Navigation bar with tabs and sync button */}
          <WebPreviewNavigation className="justify-between border-b border-border bg-background px-3 lg:px-6 py-3 gap-3">
            <TabsList className="dark:bg-background">
              <TabsTrigger value="preview">
                <HugeiconsIcon icon={ViewIcon} size={16} />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code">
                <HugeiconsIcon icon={SourceCodeIcon} size={16} />
                Code
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              className="shadow-none gap-2"
              onClick={handleSync}
            >
              <HugeiconsIcon
                icon={ArrowReloadVerticalIcon}
                className="size-4"
              />
              Sync
            </Button>
          </WebPreviewNavigation>

          {/* Tab content */}
          <TabsContent
            value="preview"
            className="flex-1 overflow-hidden m-0 flex flex-col bg-card"
          >
            {previewError ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {previewError}
              </div>
            ) : isLoading && !sandboxUrl ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="size-5 animate-spin"
                  />
                  <span>{loadingSteps[loadingStep]}</span>
                </div>
              </div>
            ) : !isInitialized ? (
              <div className="flex items-center justify-center h-full">
                <Button
                  onClick={handleInitialize}
                  className="gap-2"
                  size="default"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <HugeiconsIcon icon={ViewIcon} className="size-4" />
                  )}
                  Initialize sandbox
                </Button>
              </div>
            ) : (
              <WebPreviewBody src={sandboxUrl} />
            )}
          </TabsContent>

          <TabsContent value="code" className="flex-1 overflow-hidden m-0">
            <CodeView
              fileTree={fileTree}
              onReadFile={readFile}
              onReadFiles={readFiles}
            />
          </TabsContent>
        </WebPreview>
      </Tabs>
    </div>
  )
}
