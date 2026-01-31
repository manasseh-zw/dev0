import { createFileRoute, useParams } from '@tanstack/react-router'
import { TaskBoard } from '@/components/task/board/task-board'
import { TaskSubHeader } from '@/components/layout/header/task-subheader'
import { Route as ProjectRoute } from '../$projectId'

export const Route = createFileRoute('/project/$projectId/')({
  component: DashboardPage,
})

function DashboardPage() {
  const project = ProjectRoute.useLoaderData()
  const { projectId } = useParams({ from: '/project/$projectId/' })

  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
      <TaskSubHeader />
      <main className="flex-1 w-full overflow-x-auto">
        <TaskBoard tasks={project.tasks} projectId={projectId} />
      </main>
    </div>
  )
}
