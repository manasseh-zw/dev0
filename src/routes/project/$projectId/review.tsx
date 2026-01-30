import { createFileRoute } from '@tanstack/react-router'
import { AllPrs } from '@/components/review/all-prs'
import { ReviewSubHeader } from '@/components/layout/header/review-subheader'
import { Route as ProjectRoute } from '../$projectId'

export const Route = createFileRoute('/project/$projectId/review')({
  component: ReviewPage,
})

function ReviewPage() {
  const project = ProjectRoute.useLoaderData()

  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
      <ReviewSubHeader />
      <main className="flex-1 w-full overflow-y-auto">
        <AllPrs tasks={project.tasks} />
      </main>
    </div>
  )
}

