'use client'

import { AnimatePresence, motion } from 'motion/react'
import type { TaskWithBlocked } from '@/lib/types'
import { Status } from '@/components/task/mock-data/statuses'
import { TaskCard } from './task-card'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'

interface TaskColumnProps {
  status: Status
  tasks: TaskWithBlocked[]
  startingTaskIds?: Record<string, boolean>
  retryingTaskIds?: Record<string, boolean>
  onModelChange?: (
    taskId: string,
    model: 'gemini-3-flash-preview' | 'gemini-3-pro-preview',
  ) => void
  onStartTask?: (taskId: string) => void
  onRetryTask?: (taskId: string) => void
  onTaskClick?: (task: TaskWithBlocked) => void
}

export function TaskColumn({
  status,
  tasks,
  startingTaskIds = {},
  retryingTaskIds = {},
  onModelChange,
  onStartTask,
  onRetryTask,
  onTaskClick,
}: TaskColumnProps) {
  const StatusIcon = status.icon

  return (
    <div className="shrink-0 w-[300px] lg:w-[360px] flex flex-col h-full flex-1">
      <div className="rounded-lg border border-border p-3 bg-muted/70 dark:bg-muted/50 flex flex-col max-h-full">
        <div className="flex items-center justify-between mb-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="size-4 flex items-center justify-center">
              <StatusIcon />
            </div>
            <span className="text-sm font-medium">{status.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto h-full">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layoutId={task.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  mass: 1,
                  opacity: { duration: 0.3 },
                }}
              >
                <TaskCard
                  task={task}
                  status={status}
                  isBlocked={task.isBlocked}
                  isStarting={Boolean(startingTaskIds[task.id])}
                  isRetrying={Boolean(retryingTaskIds[task.id])}
                  onModelChange={onModelChange}
                  onStartTask={onStartTask}
                  onRetryTask={onRetryTask}
                  onClick={() => onTaskClick?.(task)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-xs h-auto py-1 px-0 self-start hover:bg-background"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            <span>Add task</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
