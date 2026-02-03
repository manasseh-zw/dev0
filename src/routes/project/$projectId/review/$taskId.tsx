import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/project/$projectId/review/$taskId')({
  component: ReviewTaskLayout,
})

function ReviewTaskLayout() {
  return <Outlet />
}
