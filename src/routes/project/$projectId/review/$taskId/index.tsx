import { createFileRoute, Link, useParams, Await } from '@tanstack/react-router'
import { Suspense } from 'react'
import { getReviewPRSummary, getTaskWithLogs } from '@/lib/actions'
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
import type { TaskWithLogs } from '@/lib/types/task'
import type { ReviewPRSummary } from '@/lib/types/review'

export const Route = createFileRoute('/project/$projectId/review/$taskId/')({
  loader: ({ params }) => {
    const prDetailsPromise = getReviewPRSummary({
      data: { projectId: params.projectId, taskId: params.taskId },
    })
    const taskPromise = isMockProjectId(params.projectId)
      ? Promise.resolve(
          getMockProject().tasks.find((task) => task.id === params.taskId) ??
            null,
        )
      : getTaskWithLogs({ data: { taskId: params.taskId } })
    return { prDetailsPromise, taskPromise }
  },
  component: ReviewDetailPage,
})

function ReviewDetailPage() {
  const { taskId, projectId } = useParams({
    from: '/project/$projectId/review/$taskId/',
  })
  const { prDetailsPromise, taskPromise } = Route.useLoaderData()

  return (
    <Suspense fallback={<ReviewDetailSkeleton />}>
      <Await promise={taskPromise}>
        {(task) =>
          task ? (
            <Await promise={prDetailsPromise}>
              {(prDetails) => (
                <ReviewDetailContentWrapper task={task} prDetails={prDetails} />
              )}
            </Await>
          ) : (
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
      </Await>
    </Suspense>
  )
}

interface ReviewDetailContentWrapperProps {
  task: Task | TaskWithLogs
  prDetails: ReviewPRSummary | null
}

function ReviewDetailContentWrapper({
  task,
  prDetails,
}: ReviewDetailContentWrapperProps) {
  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
      <ReviewDetailHeader task={task} prDetails={prDetails} />

      <div className="flex flex-1 overflow-hidden">
        <ReviewDetailContent task={task} prDetails={prDetails} />
        <ReviewSidebar task={task} prDetails={prDetails} />
      </div>
    </div>
  )
}
