import { createFileRoute } from '@tanstack/react-router'
import { AllPrs } from '@/components/review/all-prs'
import { getReviewPRList } from '@/lib/actions'

export const Route = createFileRoute('/project/$projectId/review/')({
  loader: async ({ params }) => {
    return getReviewPRList({
      data: { projectId: params.projectId },
    })
  },
  component: ReviewIndexPage,
})

function ReviewIndexPage() {
  const items = Route.useLoaderData()

  return <AllPrs items={items} />
}
