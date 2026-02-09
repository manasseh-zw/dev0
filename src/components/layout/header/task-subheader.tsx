import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { TaskFilters } from '@/components/task/header/task-filters'
import { CreateTaskModal } from '@/components/task/create-task-modal'
import { useParams } from '@tanstack/react-router'

export function TaskSubHeader() {
  const { projectId } = useParams({ from: '/project/$projectId/' })
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 lg:px-6 py-3 border-b border-border bg-background">
      <div className="flex items-center gap-2 shrink-0">
        <TaskFilters />
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <Button
          size="sm"
          className="sm:gap-2 shrink-0"
          onClick={() => setIsModalOpen(true)}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          <span className="hidden sm:inline">Add task</span>
        </Button>
      </div>
      <CreateTaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        projectId={projectId}
      />
    </div>
  )
}
