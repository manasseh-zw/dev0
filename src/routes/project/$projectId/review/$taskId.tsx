import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { Route as ProjectRoute } from '../../$projectId'
import {
  getMockProject,
  getMockPRDetails,
  isMockProjectId,
} from '@/data/mock'
import { ReviewDetailHeader } from '@/components/review/detail/review-detail-header'
import { ReviewDetailContent } from '@/components/review/detail/review-detail-content'
import { ReviewSidebar } from '@/components/review/detail/review-sidebar'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/project/$projectId/review/$taskId')({
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

  // Get mock PR details
  const prDetails = task ? getMockPRDetails(task.id) : null

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
