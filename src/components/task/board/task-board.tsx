'use client';

import * as React from 'react';
import { useRouter } from '@tanstack/react-router';
import { LayoutGroup } from 'motion/react';
import type { TaskStatus, TaskWithBlocked } from '@/lib/types';
import { updateTaskModel, startExecution } from '@/lib/actions';
import { useExecutionEvents } from '@/lib/hooks/use-execution-events';
import { statuses } from '@/components/task/mock-data/statuses';
import { TaskColumn } from './task-column';
import { TaskSheet } from '@/components/task/sheet';

type TaskBoardProps = {
  /** Tasks with isBlocked pre-computed (from server action or mock data) */
  tasks: TaskWithBlocked[];
  /** Project ID for SSE connection (required for real projects) */
  projectId: string;
};

type GeminiModel = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

export function TaskBoard({ tasks, projectId }: TaskBoardProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<TaskWithBlocked[]>(tasks);
  const [selectedTask, setSelectedTask] = React.useState<TaskWithBlocked | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Subscribe to execution events for real-time updates
  useExecutionEvents(projectId, {
    enabled: Boolean(projectId) && projectId !== 'mock',
    onEvent: (event) => {
      // On task status changes, revalidate from server (single source of truth)
      if (
        event.type === 'task_started' ||
        event.type === 'task_completed' ||
        event.type === 'task_failed'
      ) {
        router.invalidate();
      }
    },
  });

  React.useEffect(() => {
    setItems(tasks);
    // Update selected task if it changed
    if (selectedTask) {
      const updated = tasks.find((t) => t.id === selectedTask.id);
      if (updated) {
        setSelectedTask(updated);
      }
    }
  }, [tasks, selectedTask?.id]);

  // Group tasks by status
  const tasksByStatus = React.useMemo(() => groupTasksByStatus(items), [items]);


  const handleModelChange = React.useCallback(
    async (taskId: string, model: GeminiModel) => {
      const currentTask = items.find((task) => task.id === taskId);
      if (!currentTask) {
        return;
      }

      setItems((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, geminiModel: model } : task,
        ),
      );

      if (currentTask.projectId === 'mock') {
        return;
      }

      try {
        await updateTaskModel({ data: { taskId, geminiModel: model } });
      } catch (error) {
        console.error('Failed to update task model', error);
        setItems((current) =>
          current.map((task) =>
            task.id === taskId
              ? { ...task, geminiModel: currentTask.geminiModel }
              : task,
          ),
        );
      }
    },
    [items],
  );

  // Handle starting a task
  const handleStartTask = React.useCallback(async (taskId: string) => {
    const task = items.find((t) => t.id === taskId);
    if (!task) return;

    // Optimistically update UI to RUNNING
    setItems((current) =>
      current.map((t) =>
        t.id === taskId ? { ...t, status: 'RUNNING' as TaskStatus, attempts: 1 } : t,
      ),
    );

    // For mock projects, simulate agent completing work after 3 seconds
    if (task.projectId === 'mock') {
      setTimeout(() => {
        setItems((current) =>
          current.map((t) =>
            t.id === taskId ? { ...t, status: 'REVIEW' as TaskStatus } : t,
          ),
        );
      }, 3000);
      return;
    }

    // For real projects, call the execution API
    try {
      const result = await startExecution({ data: { projectId: task.projectId, taskId } });
      if (!result.success) {
        // Revert optimistic update on failure
        console.error('Failed to start task:', result.message);
        setItems((current) =>
          current.map((t) =>
            t.id === taskId ? { ...t, status: 'PENDING' as TaskStatus, attempts: 0 } : t,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to start task:', error);
      // Revert optimistic update on error
      setItems((current) =>
        current.map((t) =>
          t.id === taskId ? { ...t, status: 'PENDING' as TaskStatus, attempts: 0 } : t,
        ),
      );
    }
  }, [items]);

  // Handle task card click to open sheet
  const handleTaskClick = React.useCallback((task: TaskWithBlocked) => {
    setSelectedTask(task);
    setSheetOpen(true);
  }, []);

  return (
    <>
      <LayoutGroup>
        <div className="flex h-full gap-3 px-3 pt-4 pb-2 min-w-max overflow-hidden">
          {statuses.map((status) => (
            <TaskColumn
              key={status.id}
              status={status}
              tasks={tasksByStatus[status.id] || []}
              onModelChange={handleModelChange}
              onStartTask={handleStartTask}
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
  );
}

function groupTasksByStatus(tasks: TaskWithBlocked[]): Record<TaskStatus, TaskWithBlocked[]> {
  const initial: Record<TaskStatus, TaskWithBlocked[]> = {
    PENDING: [],
    RUNNING: [],
    REVIEW: [],
    DONE: [],
    FAILED: [],
    SKIPPED: [],
  };
  
  return tasks.reduce((acc, task) => {
    acc[task.status].push(task);
    return acc;
  }, initial);
}

