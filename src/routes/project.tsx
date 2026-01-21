import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/project')({
  component: ProjectLayout,
})

function ProjectLayout() {
  return (
    <div className="h-screen w-screen bg-background flex flex-col">
      {/* Project Layout - will contain header, sidebar in the future */}
      <Outlet />
    </div>
  )
}
