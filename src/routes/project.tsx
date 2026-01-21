import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/sidebar/app-sidebar'

export const Route = createFileRoute('/project')({
  component: ProjectLayout,
})

function ProjectLayout() {
  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full overflow-hidden">
        <DashboardSidebar />
        <SidebarInset className="flex flex-col overflow-hidden">
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
