'use client'

import type { ReviewPRListItem } from '@/lib/types/review'
import type { ReviewStatusConfig } from './review-statuses'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Link, useParams } from '@tanstack/react-router'

interface PrLineProps {
  item: ReviewPRListItem
  reviewStatus: ReviewStatusConfig
  layoutId?: boolean
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
} as const

export function PrLine({ item, reviewStatus, layoutId = false }: PrLineProps) {
  const { projectId } = useParams({ from: '/project/$projectId/review' })
  const StatusIcon = reviewStatus.icon
  const modelValue = item.geminiModel ?? 'gemini-3-pro-preview'
  const currentModel =
    modelOptions[modelValue] ?? modelOptions['gemini-3-pro-preview']

  return (
    <Link
      to="/project/$projectId/review/$taskId"
      params={{ projectId, taskId: item.taskId }}
    >
      <motion.div
        {...(layoutId && { layoutId: `pr-line-${item.taskId}` })}
        className={cn(
          'w-full flex items-center justify-start h-11 px-6 hover:bg-sidebar/50 transition-colors cursor-pointer',
        )}
      >
        {/* Left section: Status icon + PR number + Status selector */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="size-4 flex items-center justify-center">
            <StatusIcon />
          </div>
          {item.prNumber && (
            <span className="text-sm text-muted-foreground font-medium w-[72px] truncate shrink-0">
              PR #{item.prNumber}
            </span>
          )}
        </div>

        {/* Center section: Title */}
        <span className="min-w-0 flex items-center justify-start mr-1 ml-2 flex-1">
          <span className="text-sm font-medium truncate">{item.taskTitle}</span>
        </span>

        {/* Right section: Phase badge + Date + Model indicator */}
        <div className="flex items-center justify-end gap-3 ml-auto shrink-0">
          {/* Phase badge */}
          <div className="hidden sm:flex items-center gap-1.5 border border-border rounded-sm py-0.5 px-2 text-xs text-muted-foreground">
            <span>Phase {item.taskPhase}</span>
          </div>

          {/* Date */}
          <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline-block">
            {format(new Date(item.taskCreatedAt), 'MMM dd')}
          </span>

          {/* Model indicator (replaces avatar) */}
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-1 text-[10px] font-medium text-foreground">
            <span
              className={`size-2 rounded-full ${currentModel.dotClassName}`}
            />
            <span className="truncate max-w-[72px] hidden lg:inline-block">
              {currentModel.label}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
