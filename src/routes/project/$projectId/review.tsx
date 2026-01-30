import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/project/$projectId/review')({
  component: ReviewPage,
})

function ReviewPage() {
  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
      <div className="border-b border-border bg-background px-3 lg:px-6 py-3">
        <div className="text-sm font-medium text-muted-foreground">
          Review tools
        </div>
      </div>
      <main className="flex-1 w-full overflow-x-auto p-6">
        <div className="text-sm text-muted-foreground">Review tab</div>
      </main>
    </div>
  )
}
