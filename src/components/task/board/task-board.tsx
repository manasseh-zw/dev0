import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import { LayoutGroup } from 'motion/react'
import type { TaskStatus, TaskWithBlocked } from '@/lib/types'
import {
  getTaskWithLogs,
  updateTaskModel,
  startExecution,
  updateTaskStatus,
} from '@/lib/actions'
import { statuses } from '@/components/task/mock-data/statuses'
import { TaskColumn } from './task-column'
import { TaskSheet } from '@/components/task/sheet'
import { useRealtime } from '@/lib/realtime/client'
import { getExecutionChannel } from '@/lib/realtime/schema'
import type { TaskWithLogs } from '@/lib/types/task'

type TaskBoardProps = {
  /** Tasks with isBlocked pre-computed (from server action or mock data) */
  tasks: TaskWithBlocked[]
  /** Project ID for SSE connection (required for real projects) */
  projectId: string
}

type GeminiModel = 'gemini-3-flash-preview' | 'gemini-3-pro-preview'
type TaskWithLogsOptional = TaskWithBlocked & {
  executionLogs?: TaskWithLogs['executionLogs'] | null
}

export function TaskBoard({ tasks, projectId }: TaskBoardProps) {
  const router = useRouter()
  const [items, setItems] = React.useState<TaskWithBlocked[]>(tasks)
  const [selectedTask, setSelectedTask] =
    React.useState<TaskWithLogsOptional | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [optimisticStatuses, setOptimisticStatuses] = React.useState<
    Record<string, TaskStatus>
  >({})
  const [startingTaskIds, setStartingTaskIds] = React.useState<
    Record<string, boolean>
  >({})
  const [retryingTaskIds, setRetryingTaskIds] = React.useState<
    Record<string, boolean>
  >({})

  const shouldListen = Boolean(projectId) && projectId !== 'mock'
  const channel = shouldListen
    ? getExecutionChannel(projectId)
    : 'execution:disabled'

  useRealtime({
    channels: [channel],
    events: [
      'execution.task_started',
      'execution.task_review',
      'execution.task_failed',
    ],
    onData: (payload) => {
      if (!shouldListen) return
      const data = payload.data as { taskId: string }
      setStartingTaskIds((current) => {
        if (!current[data.taskId]) return current
        const next = { ...current }
        delete next[data.taskId]
        return next
      })

      const nextStatus: TaskStatus =
        payload.event === 'execution.task_started'
          ? 'RUNNING'
          : payload.event === 'execution.task_review'
            ? 'REVIEW'
            : 'FAILED'
      setOptimisticStatuses((current) => ({
        ...current,
        [data.taskId]: nextStatus,
      }))
      router.invalidate()
    },
  })

  React.useEffect(() => {
    setItems(
      tasks.map((task) => {
        const optimistic = optimisticStatuses[task.id]
        if (optimistic === 'RUNNING' && task.status === 'PENDING') {
          return {
            ...task,
            status: optimistic,
          }
        }
        if (optimistic === 'PENDING' && task.status === 'FAILED') {
          return {
            ...task,
            status: optimistic,
          }
        }
        return task
      }),
    )
    setOptimisticStatuses((current) => {
      let changed = false
      const next = { ...current }
      for (const task of tasks) {
        const optimistic = next[task.id]
        if (!optimistic) continue
        if (optimistic === 'RUNNING' && task.status !== 'PENDING') {
          delete next[task.id]
          changed = true
        }
        if (optimistic === 'PENDING' && task.status === 'PENDING') {
          delete next[task.id]
          changed = true
        }
      }
      return changed ? next : current
    })
    // Update selected task if it changed, preserve loaded logs
    if (selectedTask) {
      const updated = tasks.find((t) => t.id === selectedTask.id)
      if (updated) {
        setSelectedTask((current) =>
          current
            ? { ...updated, executionLogs: current.executionLogs }
            : updated,
        )
      }
    }
  }, [tasks, selectedTask?.id, optimisticStatuses])

  // Group tasks by status
  const tasksByStatus = React.useMemo(() => groupTasksByStatus(items), [items])

  const handleModelChange = React.useCallback(
    async (taskId: string, model: GeminiModel) => {
      const currentTask = items.find((task) => task.id === taskId)
      if (!currentTask) {
        return
      }

      setItems((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, geminiModel: model } : task,
        ),
      )

      if (currentTask.projectId === 'mock') {
        return
      }

      try {
        await updateTaskModel({ data: { taskId, geminiModel: model } })
      } catch (error) {
        console.error('Failed to update task model', error)
        setItems((current) =>
          current.map((task) =>
            task.id === taskId
              ? { ...task, geminiModel: currentTask.geminiModel }
              : task,
          ),
        )
      }
    },
    [items],
  )

  // Handle starting a task
  const handleStartTask = React.useCallback(
    async (taskId: string) => {
      const task = items.find((t) => t.id === taskId)
      if (!task) return

      setStartingTaskIds((current) => ({ ...current, [taskId]: true }))

      // For mock projects, simulate agent completing work after 3 seconds
      if (task.projectId === 'mock') {
        setTimeout(() => {
          setStartingTaskIds((current) => {
            if (!current[taskId]) return current
            const next = { ...current }
            delete next[taskId]
            return next
          })
          setItems((current) =>
            current.map((t) =>
              t.id === taskId ? { ...t, status: 'REVIEW' as TaskStatus } : t,
            ),
          )
        }, 3000)
        return
      }

      // For real projects, call the execution API
      try {
        const result = await startExecution({
          data: { projectId: task.projectId, taskId },
        })
        if (!result.success) {
          // Revert optimistic update on failure
          console.error('Failed to start task:', result.message)
          setStartingTaskIds((current) => {
            const next = { ...current }
            delete next[taskId]
            return next
          })
        } else {
          setStartingTaskIds((current) => {
            const next = { ...current }
            delete next[taskId]
            return next
          })
          setOptimisticStatuses((current) => ({
            ...current,
            [taskId]: 'RUNNING',
          }))
        }
      } catch (error) {
        console.error('Failed to start task:', error)
        // Revert optimistic update on error
        setStartingTaskIds((current) => {
          const next = { ...current }
          delete next[taskId]
          return next
        })
      }
    },
    [items],
  )

  const handleRetryTask = React.useCallback(
    async (taskId: string) => {
      const task = items.find((t) => t.id === taskId)
      if (!task || task.status !== 'FAILED') return

      setRetryingTaskIds((current) => ({ ...current, [taskId]: true }))

      if (task.projectId === 'mock') {
        setItems((current) =>
          current.map((t) =>
            t.id === taskId ? { ...t, status: 'PENDING' as TaskStatus } : t,
          ),
        )
        setRetryingTaskIds((current) => {
          const next = { ...current }
          delete next[taskId]
          return next
        })
        return
      }

      try {
        await updateTaskStatus({ data: { taskId, status: 'PENDING' } })
        setOptimisticStatuses((current) => ({
          ...current,
          [taskId]: 'PENDING',
        }))
        router.invalidate()
      } catch (error) {
        console.error('Failed to retry task:', error)
      } finally {
        setRetryingTaskIds((current) => {
          const next = { ...current }
          delete next[taskId]
          return next
        })
      }
    },
    [items, router],
  )

  // Handle task card click to open sheet
  const handleTaskClick = React.useCallback(
    async (task: TaskWithBlocked) => {
      setSelectedTask(task)
      setSheetOpen(true)

      if (task.projectId === 'mock' || task.status === 'PENDING') {
        return
      }

      try {
        const taskWithLogs = await getTaskWithLogs({
          data: { taskId: task.id },
        })
        setSelectedTask((current) =>
          current && current.id === task.id
            ? { ...current, executionLogs: taskWithLogs.executionLogs }
            : current,
        )
      } catch (error) {
        console.error('Failed to load task logs:', error)
      }
    },
    [],
  )

  return (
    <>
      <LayoutGroup>
        <div className="flex h-full gap-3 px-3 pt-4 pb-2 min-w-max overflow-hidden">
          {statuses.map((status) => (
            <TaskColumn
              key={status.id}
              status={status}
              tasks={tasksByStatus[status.id] || []}
              startingTaskIds={startingTaskIds}
              retryingTaskIds={retryingTaskIds}
              onModelChange={handleModelChange}
              onStartTask={handleStartTask}
              onRetryTask={handleRetryTask}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      </LayoutGroup>

      <TaskSheet
        task={selectedTask}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        projectId={projectId ?? selectedTask?.projectId}
      />
    </>
  )
}

function groupTasksByStatus(
  tasks: TaskWithBlocked[],
): Record<TaskStatus, TaskWithBlocked[]> {
  const initial: Record<TaskStatus, TaskWithBlocked[]> = {
    PENDING: [],
    RUNNING: [],
    REVIEW: [],
    DONE: [],
    FAILED: [],
    SKIPPED: [],
  }

  return tasks.reduce((acc, task) => {
    acc[task.status].push(task)
    return acc
  }, initial)
}
