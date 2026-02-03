import { createFileRoute, Await } from '@tanstack/react-router'
import { Suspense } from 'react'
import { AllPrs } from '@/components/review/all-prs'
import { ReviewListSkeleton } from '@/components/review/review-skeletons'
import { getReviewPRList } from '@/lib/actions'

export const Route = createFileRoute('/project/$projectId/review/')({
  loader: ({ params }) => {
    // Don't await - return the promise directly for deferred loading
    const itemsPromise = getReviewPRList({
      data: { projectId: params.projectId },
    })
    return { itemsPromise }
  },
  component: ReviewIndexPage,
})

function ReviewIndexPage() {
  const { itemsPromise } = Route.useLoaderData()

  return (
    <Suspense fallback={<ReviewListSkeleton />}>
      <Await promise={itemsPromise}>
        {(items) => <AllPrs items={items} />}
      </Await>
    </Suspense>
  )
}
