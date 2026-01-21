'use client';

import { useTasksStore } from '@/components/task/store/tasks-store';
import { statuses } from '@/components/task/mock-data/statuses';
import { TaskColumn } from './task-column';

export function TaskBoard() {
   const { tasksByStatus } = useTasksStore();

   return (
     <div className="flex h-full gap-3 px-3 pt-4 pb-2 min-w-max overflow-hidden">
       {statuses.map((status) => (
         <TaskColumn
           key={status.id}
           status={status}
           tasks={tasksByStatus[status.id] || []}
         />
       ))}
     </div>
   );
}

