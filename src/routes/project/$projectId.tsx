import { createFileRoute } from '@tanstack/react-router'
import { getProject } from '@/lib/actions'
import { getMockProject, isMockProjectId } from '@/data/mock'

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
    <div className="flex h-full">
      {/* Sidebar Placeholder */}
      <div className="w-64 border-r border-border bg-muted/30 p-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4">
          SIDEBAR
        </h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Project Navigation</p>
          <p>• Task List</p>
          <p>• Settings</p>
        </div>
      </div>

      {/* Main Content - Mission Control */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Mission Control
            </h1>
            <p className="text-muted-foreground">
              Project: {project.name}
            </p>
          </div>

          {/* Project Info Card */}
          <div className="border border-border rounded-lg p-6 bg-card space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {project.name}
              </h2>
              <p className="text-muted-foreground">
                {project.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>{' '}
                <span className="font-medium text-foreground">{project.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tech Stack:</span>{' '}
                <span className="font-medium text-foreground">{project.techStack}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Tasks:</span>{' '}
                <span className="font-medium text-foreground">{project.tasks.length}</span>
              </div>
              {project.repoUrl && (
                <div>
                  <span className="text-muted-foreground">Repository:</span>{' '}
                  <a 
                    href={project.repoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    GitHub
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Kanban Board Placeholder */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Kanban Board
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Task visualization will be implemented here
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-border rounded p-4 bg-muted/30">
                <h3 className="text-sm font-medium text-foreground mb-2">Pending</h3>
                <p className="text-xs text-muted-foreground">
                  {project.tasks.filter(t => t.status === 'PENDING').length} tasks
                </p>
              </div>
              <div className="border border-border rounded p-4 bg-muted/30">
                <h3 className="text-sm font-medium text-foreground mb-2">Running</h3>
                <p className="text-xs text-muted-foreground">
                  {project.tasks.filter(t => t.status === 'RUNNING').length} tasks
                </p>
              </div>
              <div className="border border-border rounded p-4 bg-muted/30">
                <h3 className="text-sm font-medium text-foreground mb-2">Done</h3>
                <p className="text-xs text-muted-foreground">
                  {project.tasks.filter(t => t.status === 'DONE').length} tasks
                </p>
              </div>
            </div>
          </div>

          {/* Console Info Notice */}
          <div className="border border-primary/20 bg-primary/5 rounded-lg p-4">
            <p className="text-sm text-foreground">
              ℹ️ Check the browser console for detailed project information
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
