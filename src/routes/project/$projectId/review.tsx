import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useParams,
} from '@tanstack/react-router'
import { ReviewSubHeader } from '@/components/layout/header/review-subheader'
import { buttonVariants } from '@/components/ui/button'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/project/$projectId/review')({
  component: ReviewPage,
})

function ReviewPage() {
  const { pathname } = useLocation()
  const { projectId } = useParams({ from: '/project/$projectId/review' })
  const isDetailView =
    pathname.includes('/review/') && !pathname.endsWith('/review')

  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
      {isDetailView ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 lg:px-6 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/project/$projectId/review"
              params={{ projectId }}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'gap-1.5',
              )}
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
              Back to Reviews
            </Link>
          </div>
        </div>
      ) : (
        <ReviewSubHeader />
      )}
      <main className="flex-1 w-full overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

