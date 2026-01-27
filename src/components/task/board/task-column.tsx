"use client";

import type { Task } from "@/lib/types";
import { Status } from "@/components/task/mock-data/statuses";
import { TaskCard } from "./task-card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";


interface TaskColumnProps {
  status: Status;
  tasks: Task[];
  onModelChange?: (
    taskId: string,
    model: 'gemini-3-flash-preview' | 'gemini-3-pro-preview',
  ) => void;
}

export function TaskColumn({ status, tasks, onModelChange }: TaskColumnProps) {
  const StatusIcon = status.icon;

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
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              status={status}
              onModelChange={onModelChange}
            />
          ))}

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
  );
}

