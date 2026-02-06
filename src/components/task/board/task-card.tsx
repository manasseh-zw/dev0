'use client'

import type { Status } from '@/components/task/mock-data/statuses'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import type { Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Calendar01Icon,
  CheckmarkCircle02Icon,
  File01Icon,
  InformationCircleIcon,
  PlayIcon,
  Refresh01Icon,
  SquareLock02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link } from '@tanstack/react-router'

interface TaskCardProps {
  task: Task
  status: Status
  /** Pre-computed blocked status - computed at board level for performance */
  isBlocked?: boolean
  isStarting?: boolean
  isRetrying?: boolean
  onModelChange?: (
    taskId: string,
    model: 'gemini-3-flash-preview' | 'gemini-3-pro-preview',
  ) => void
  onStartTask?: (taskId: string) => void
  onRetryTask?: (taskId: string) => void
  onClick?: () => void
}

const modelOptions = [
  {
    id: 'gemini-3-pro-preview',
    label: 'Gemini Pro',
    dotClassName: 'bg-blue-500/80 ring-1 ring-blue-200/70 shadow-sm',
  },
  {
    id: 'gemini-3-flash-preview',
    label: 'Gemini Flash',
    dotClassName: 'bg-amber-400/80 ring-1 ring-amber-200/70 shadow-sm',
  },
] as const

export function TaskCard({
  task,
  status,
  isBlocked = false,
  isStarting = false,
  isRetrying = false,
  onModelChange,
  onStartTask,
  onRetryTask,
  onClick,
}: TaskCardProps) {
  const StatusIcon = status.icon
  const isCompleted = task.status === 'DONE'
  const isFailed = task.status === 'FAILED'
  const isPending = task.status === 'PENDING'
  const isInReview = task.status === 'REVIEW'
  const isStartDisabled = isBlocked || isStarting
  const hasPr = Boolean(task.prUrl)
  const modelValue = task.geminiModel ?? 'gemini-3-pro-preview'
  const currentModel =
    modelOptions.find((option) => option.id === modelValue) ?? modelOptions[0]

  return (
    <div
      className="bg-background shrink-0 rounded-lg overflow-hidden border border-border cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-5 mt-0.5 shrink-0 flex items-center justify-center bg-muted rounded-sm p-1">
            <StatusIcon />
          </div>
          <h3 className="text-sm font-medium leading-tight flex-1">
            {task.title}
          </h3>
          {isBlocked && (
            <HugeiconsIcon
              icon={SquareLock02Icon}
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          )}
          {isFailed && (
            <HugeiconsIcon
              icon={InformationCircleIcon}
              className="size-4 shrink-0 text-red-500"
            />
          )}
          {isCompleted && (
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              className="size-4 shrink-0 text-green-500"
            />
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description ?? 'No description yet.'}
        </p>
      </div>

      <div className="px-3 py-2.5 border-t border-border border-dashed">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-1 text-[10px] font-medium text-foreground outline-none">
                <span
                  className={`size-2 rounded-full ${currentModel.dotClassName}`}
                />
                <span className="truncate max-w-[88px]">
                  {currentModel.label}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuRadioGroup
                  value={modelValue}
                  onValueChange={(value) =>
                    onModelChange?.(
                      task.id,
                      value as
                        | 'gemini-3-flash-preview'
                        | 'gemini-3-pro-preview',
                    )
                  }
                >
                  {modelOptions.map((option) => (
                    <DropdownMenuRadioItem key={option.id} value={option.id}>
                      <span
                        className={`size-2 rounded-full ${option.dotClassName}`}
                      />
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-1.5 border border-border rounded-sm py-1 px-2">
              <HugeiconsIcon icon={Calendar01Icon} className="size-3" />
              <span>Phase {task.phase}</span>
            </div>
            {hasPr && (
              <div className="flex items-center gap-1.5 border border-border rounded-sm py-1 px-2">
                <HugeiconsIcon icon={File01Icon} className="size-3" />
                <span>{task.prNumber ? `PR #${task.prNumber}` : 'PR'}</span>
              </div>
            )}
          </div>

          {isPending && (
            <Button
              size="sm"
              className="px-2 text-[10px] gap-1"
              disabled={isStartDisabled}
              onClick={(event) => {
                event.stopPropagation()
                onStartTask?.(task.id)
              }}
            >
              {isStarting ? (
                <span className="inline-flex items-center gap-1">
                  <Spinner className="size-3" />
                  Starting
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <HugeiconsIcon icon={PlayIcon} className="size-3" />
                  Start
                </span>
              )}
            </Button>
          )}
          {isInReview && (
            <Link
              to="/project/$projectId/review/$taskId"
              params={{ projectId: task.projectId, taskId: task.id }}
              onClick={(event) => event.stopPropagation()}
              className={cn(
                buttonVariants({ size: 'sm' }),
                'px-2 text-[10px] gap-1',
              )}
            >
              Review
            </Link>
          )}
          {isFailed && (
            <Button
              size="icon"
              variant="outline"
              className="size-7"
              disabled={isRetrying || isStarting}
              onClick={(event) => {
                event.stopPropagation()
                onRetryTask?.(task.id)
              }}
              aria-label="Retry task"
            >
              {isRetrying ? (
                <Spinner className="size-3" />
              ) : (
                <HugeiconsIcon icon={Refresh01Icon} className="size-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
