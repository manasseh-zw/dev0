'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { TaskFilters } from '@/components/task/header/task-filters'

export function TaskSubHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 lg:px-6 py-3 border-b border-border bg-background">
      <div className="flex items-center gap-2 shrink-0">
        <TaskFilters />
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <Button size="sm" className="sm:gap-2 shrink-0">
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          <span className="hidden sm:inline">Add task</span>
        </Button>
      </div>
    </div>
  )
}
