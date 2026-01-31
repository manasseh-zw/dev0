'use client'

import * as React from 'react'
import type { TaskWithLogs } from '@/lib/types/task'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon, CommandLineIcon } from '@hugeicons/core-free-icons'
import { TaskInfo } from '@/components/task/sheet/task-info'
import { TaskLogs } from '@/components/task/sheet/task-logs'
import { statuses } from '@/components/task/mock-data/statuses'

interface TaskSheetProps {
  task: TaskWithLogs | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: string
}

export function TaskSheet({ task, open, onOpenChange, projectId }: TaskSheetProps) {
  const [activeTab, setActiveTab] = React.useState('info')

  // Reset to info tab when a new task is selected
  React.useEffect(() => {
    if (task) {
      setActiveTab('info')
    }
  }, [task?.id])

  if (!task) return null

  const status = statuses.find((s) => s.id === task.status) ?? statuses[0]
  // Check for logs in executionLogs relation (new) or old logs column
  const hasLogs = task.status !== 'PENDING' && ((task.executionLogs?.events?.length ?? 0) > 0 || (task.logs?.length ?? 0) > 0)
  const isRunning = task.status === 'RUNNING'
  const logsDisabled = task.status === 'PENDING'

  return (
    <Sheet  open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg rounded-l-xl rounded-r-none border-r-0 p-0 flex flex-col"
        showCloseButton={true}
      >
        <SheetHeader className="px-6 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="size-6 shrink-0 flex items-center justify-center bg-muted rounded-md p-1">
              <status.icon />
            </div>
            <SheetTitle className="text-base font-semibold leading-tight line-clamp-1">
              {task.title}
            </SheetTitle>
          </div>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 overflow-hidden "
        >
          <TabsList className="mx-6 mt-1 mb-0 w-fit dark:bg-background">
            <TabsTrigger value="info">
              <HugeiconsIcon icon={InformationCircleIcon} size={14} />
              Info
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              disabled={logsDisabled}
            >
              <HugeiconsIcon icon={CommandLineIcon} size={14} />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="info"
            className="flex-1 overflow-y-auto px-6 py-4 m-0"
          >
            <TaskInfo task={task} status={status} />
          </TabsContent>

          <TabsContent
            value="logs"
            className="flex-1 overflow-hidden px-6 py-4 m-0"
          >
            <TaskLogs
              task={task}
              projectId={projectId}
              isRunning={isRunning}
              hasLogs={hasLogs}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
