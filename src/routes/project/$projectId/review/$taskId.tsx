import { createFileRoute, Link, useParams, Await } from '@tanstack/react-router'
import { Suspense } from 'react'
import { Route as ProjectRoute } from '../../$projectId'
import { getReviewPRSummary } from '@/lib/actions'
import { getMockProject, isMockProjectId } from '@/data/mock'
import { ReviewDetailHeader } from '@/components/review/detail/review-detail-header'
import { ReviewDetailContent } from '@/components/review/detail/review-detail-content'
import { ReviewSidebar } from '@/components/review/detail/review-sidebar'
import { ReviewDetailSkeleton } from '@/components/review/review-skeletons'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Task } from '@/lib/types'
import type { ReviewPRSummary } from '@/lib/types/review'

export const Route = createFileRoute('/project/$projectId/review/$taskId')({
  loader: ({ params }) => {
    // Don't await - return the promise directly for deferred loading
    const prDetailsPromise = getReviewPRSummary({
      data: { projectId: params.projectId, taskId: params.taskId },
    })
    return { prDetailsPromise }
  },
  component: ReviewDetailPage,
})

function ReviewDetailPage() {
  const { taskId, projectId } = useParams({
    from: '/project/$projectId/review/$taskId',
  })
  const project = isMockProjectId(projectId)
    ? getMockProject()
    : ProjectRoute.useLoaderData()

  // Find the task
  const task = project.tasks.find((t) => t.id === taskId)

  const { prDetailsPromise } = Route.useLoaderData()

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
    <Suspense fallback={<ReviewDetailSkeleton />}>
      <Await promise={prDetailsPromise}>
        {(prDetails) => (
          <ReviewDetailContentWrapper task={task} prDetails={prDetails} />
        )}
      </Await>
    </Suspense>
  )
}

interface ReviewDetailContentWrapperProps {
  task: Task
  prDetails: ReviewPRSummary | null
}

function ReviewDetailContentWrapper({
  task,
  prDetails,
}: ReviewDetailContentWrapperProps) {
  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
      {/* Header with PR title and status */}
      <ReviewDetailHeader task={task} prDetails={prDetails} />

      {/* Main content area with tabs and sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content - tabs */}
        <ReviewDetailContent task={task} prDetails={prDetails} />

        {/* Right sidebar */}
        <ReviewSidebar task={task} prDetails={prDetails} />
      </div>
    </div>
  )
}
