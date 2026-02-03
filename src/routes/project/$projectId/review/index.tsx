import { createFileRoute } from '@tanstack/react-router'
import { AllPrs } from '@/components/review/all-prs'
import { Route as ProjectRoute } from '../../$projectId'

export const Route = createFileRoute('/project/$projectId/review/')({
  component: ReviewIndexPage,
})

function ReviewIndexPage() {
  const project = ProjectRoute.useLoaderData()

  return <AllPrs tasks={project.tasks} />
}
