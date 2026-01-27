'use client';

import * as React from 'react';
import type { Task, TaskStatus } from '@/lib/types';
import { updateTaskModel } from '@/lib/actions';
import { statuses } from '@/components/task/mock-data/statuses';
import { TaskColumn } from './task-column';

type TaskBoardProps = {
  tasks: Task[];
};

type GeminiModel = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

export function TaskBoard({ tasks }: TaskBoardProps) {
  const [items, setItems] = React.useState<Task[]>(tasks);

  React.useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const tasksByStatus = groupTasksByStatus(items);

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

  return (
    <div className="flex h-full gap-3 px-3 pt-4 pb-2 min-w-max overflow-hidden">
      {statuses.map((status) => (
        <TaskColumn
          key={status.id}
          status={status}
          tasks={tasksByStatus[status.id] || []}
          onModelChange={handleModelChange}
        />
      ))}
    </div>
  );
}

function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  return tasks.reduce(
    (acc, task) => {
      acc[task.status].push(task);
      return acc;
    },
    {
      PENDING: [],
      RUNNING: [],
      REVIEW: [],
      DONE: [],
      FAILED: [],
      SKIPPED: [],
    },
  );
}

