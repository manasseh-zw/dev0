import { createFileRoute, Await, Link, useParams } from '@tanstack/react-router'
import { Suspense } from 'react'
import { Route as ProjectRoute } from '../../../$projectId'
import { getReviewPRSummary, getReviewPRFiles } from '@/lib/actions'
import { getMockProject, isMockProjectId } from '@/data/mock'
import { DiffViewer } from '@/components/review/diff'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Task } from '@/lib/types'
import type { ReviewPRFile, ReviewPRSummary } from '@/lib/types/review'

export const Route = createFileRoute('/project/$projectId/review/$taskId/diff')(
  {
    loader: ({ params }) => {
      const prDetailsPromise = getReviewPRSummary({
        data: { projectId: params.projectId, taskId: params.taskId },
      })
      const prFilesPromise = getReviewPRFiles({
        data: { projectId: params.projectId, taskId: params.taskId },
      })
      return { prDetailsPromise, prFilesPromise }
    },
    component: ReviewDiffPage,
  },
)

function ReviewDiffPage() {
  const { taskId, projectId } = useParams({
    from: '/project/$projectId/review/$taskId/diff',
  })
  const project = isMockProjectId(projectId)
    ? getMockProject()
    : ProjectRoute.useLoaderData()

  const task = project.tasks.find((t) => t.id === taskId)
  const { prDetailsPromise, prFilesPromise } = Route.useLoaderData()

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Task not found</p>
        <Link
          to="/project/$projectId/review"
          params={{ projectId }}
          className={cn(buttonVariants({ variant: 'outline' }), 'gap-1.5')}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
          Back to Reviews
        </Link>
      </div>
    )
  }

  return (
    <Suspense fallback={<DiffViewerSkeleton />}>
      <Await promise={Promise.all([prDetailsPromise, prFilesPromise])}>
        {([prDetails, prFiles]) => (
          <DiffViewerWrapper
            task={task}
            prDetails={prDetails}
            files={prFiles}
          />
        )}
      </Await>
    </Suspense>
  )
}

interface DiffViewerWrapperProps {
  task: Task
  prDetails: ReviewPRSummary | null
  files: ReviewPRFile[]
}

function DiffViewerWrapper({ task, prDetails, files }: DiffViewerWrapperProps) {
  return <DiffViewer task={task} prDetails={prDetails} files={files} />
}

function DiffViewerSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden animate-pulse">
      <div className="flex items-center justify-between gap-4 px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-muted rounded" />
          <div className="h-4 w-px bg-border" />
          <div className="h-8 w-32 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-8 w-32 bg-muted rounded" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 border-r border-border bg-muted/30 p-2">
          <div className="h-4 w-24 bg-muted rounded mb-2" />
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 bg-muted rounded" />
            ))}
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="border border-border rounded-lg overflow-hidden"
            >
              <div className="h-10 bg-muted/50 border-b border-border" />
              <div className="h-48 bg-muted/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
