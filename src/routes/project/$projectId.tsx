import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { getProject } from '@/lib/actions'
import { getMockProject, isMockProjectId } from '@/data/mock'
import { ProjectHeader } from '@/components/layout/header/project-header'

export const Route = createFileRoute('/project/$projectId')({
  component: ProjectLayout,
  loader: async ({ params }) => {
    // Use mock data for development when projectId is 'mock'
    if (isMockProjectId(params.projectId)) {
      const mockData = getMockProject()
      return mockData
    }

    const projectData = await getProject({
      data: { projectId: params.projectId },
    })

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

function ProjectLayout() {
  const { pathname } = useLocation()
  const project = Route.useLoaderData()

  // Determine the title based on the current route
  const getTitle = () => {
    if (pathname.includes('/review/')) {
      return 'Review Details'
    }
    if (pathname.endsWith('/review')) {
      return 'Review'
    }
    if (pathname.endsWith('/preview')) {
      return 'Preview'
    }
    return 'Dashboard'
  }

  const title = getTitle()

  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
      <ProjectHeader title={title} repoUrl={project.repoUrl} />
      <Outlet />
    </div>
  )
}
