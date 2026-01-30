'use client';

import type { Task } from '@/lib/types';
import type { ReviewStatusConfig } from './review-statuses';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface PrLineProps {
  task: Task;
  reviewStatus: ReviewStatusConfig;
  layoutId?: boolean;
}

const modelOptions = {
  'gemini-3-pro-preview': {
    label: 'Gemini Pro',
    dotClassName: 'bg-blue-500/80 ring-1 ring-blue-200/70',
  },
  'gemini-3-flash-preview': {
    label: 'Gemini Flash',
    dotClassName: 'bg-amber-400/80 ring-1 ring-amber-200/70',
  },
} as const;

export function PrLine({ task, reviewStatus, layoutId = false }: PrLineProps) {
  const StatusIcon = reviewStatus.icon;
  const modelValue = task.geminiModel ?? 'gemini-3-pro-preview';
  const currentModel = modelOptions[modelValue] ?? modelOptions['gemini-3-pro-preview'];

  const handleClick = () => {
    if (task.prUrl) {
      window.open(task.prUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      {...(layoutId && { layoutId: `pr-line-${task.id}` })}
      onClick={handleClick}
      className={cn(
        'w-full flex items-center justify-start h-11 px-6 hover:bg-sidebar/50 transition-colors',
        task.prUrl && 'cursor-pointer'
      )}
    >
      {/* Left section: Status icon + PR number + Status selector */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="size-4 flex items-center justify-center">
          <StatusIcon />
        </div>
        {task.prNumber && (
          <span className="text-sm text-muted-foreground font-medium w-[72px] truncate shrink-0">
            PR #{task.prNumber}
          </span>
        )}
      </div>

      {/* Center section: Title */}
      <span className="min-w-0 flex items-center justify-start mr-1 ml-2 flex-1">
        <span className="text-sm font-medium truncate">{task.title}</span>
      </span>

      {/* Right section: Phase badge + Date + Model indicator */}
      <div className="flex items-center justify-end gap-3 ml-auto shrink-0">
        {/* Phase badge */}
        <div className="hidden sm:flex items-center gap-1.5 border border-border rounded-sm py-0.5 px-2 text-xs text-muted-foreground">
          <span>Phase {task.phase}</span>
        </div>

        {/* Date */}
        <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline-block">
          {format(new Date(task.createdAt), 'MMM dd')}
        </span>

        {/* Model indicator (replaces avatar) */}
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-1 text-[10px] font-medium text-foreground">
          <span className={`size-2 rounded-full ${currentModel.dotClassName}`} />
          <span className="truncate max-w-[72px] hidden lg:inline-block">
            {currentModel.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
