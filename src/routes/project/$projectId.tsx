import { createFileRoute } from '@tanstack/react-router'
import { getProject } from '@/lib/actions'
import { getMockProject, isMockProjectId } from '@/data/mock'
import { TaskBoard } from '@/components/task/board/task-board'
import { TaskHeader } from '@/components/task/header/task-header'

export const Route = createFileRoute('/project/$projectId')({
  component: ProjectPage,
  loader: async ({ params }) => {
    // Use mock data for development when projectId is 'mock'
    if (isMockProjectId(params.projectId)) {
      const mockData = getMockProject()
      return mockData
    }
    
    const projectData = await getProject({ data: { projectId: params.projectId } })

    return projectData
  },
  pendingComponent: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <div className="text-lg text-muted-foreground animate-pulse">
          Loading project...
        </div>
      </div>
    </div>
  ),
})

function ProjectPage() {
  const project = Route.useLoaderData()

  return (
       <div className="flex-1 flex flex-col overflow-hidden h-screen">
        <TaskHeader />
        <main className="w-full h-full overflow-x-auto">
          <TaskBoard />
        </main>
      </div>  
  )
}
