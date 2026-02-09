import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  SidebarLeft01Icon,
  LayoutLeftIcon,
  LayoutTopIcon,
  GitMergeIcon,
  GitPullRequestIcon,
  ArrowLeft02Icon,
} from '@hugeicons/core-free-icons'
import { Link } from '@tanstack/react-router'
import type { DiffViewMode } from './diff-viewer'

interface DiffSubheaderProps {
  sidebarCollapsed: boolean
  onSidebarToggle: () => void
  viewMode: DiffViewMode
  onViewModeChange: (mode: DiffViewMode) => void
  prNumber: number
  onMerge: () => void
  canMerge: boolean
  prState: 'open' | 'closed' | 'merged'
  projectId: string
  taskId: string
}

export function DiffSubheader({
  sidebarCollapsed,
  onSidebarToggle,
  viewMode,
  onViewModeChange,
  prNumber,
  onMerge,
  canMerge,
  prState,
  projectId,
  taskId,
}: DiffSubheaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 border-b border-border bg-background">
      {/* Left side controls */}
      <div className="flex items-center gap-2">
        {/* Back button */}
        <Link
          to="/project/$projectId/review/$taskId/"
          params={{ projectId, taskId }}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-1.5',
          )}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
          <span className="hidden sm:inline">Back to Details</span>
        </Link>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* File tree toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSidebarToggle}
          className={cn('gap-1.5', !sidebarCollapsed && 'bg-muted')}
        >
          <HugeiconsIcon icon={SidebarLeft01Icon} size={16} />
          <span className="hidden sm:inline">Files</span>
        </Button>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* View mode toggle */}
        <div className="flex items-center rounded-md border border-border p-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('split')}
            className={cn('h-7 px-2 gap-1', viewMode === 'split' && 'bg-muted')}
          >
            <HugeiconsIcon icon={LayoutLeftIcon} size={14} />
            <span className="hidden sm:inline text-xs">Split</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('unified')}
            className={cn(
              'h-7 px-2 gap-1',
              viewMode === 'unified' && 'bg-muted',
            )}
          >
            <HugeiconsIcon icon={LayoutTopIcon} size={14} />
            <span className="hidden sm:inline text-xs">Unified</span>
          </Button>
        </div>
      </div>

      {/* Right side - PR number and merge button */}
      <div className="flex items-center gap-3">
        {/* PR identifier */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <HugeiconsIcon
            icon={prState === 'merged' ? GitMergeIcon : GitPullRequestIcon}
            size={14}
            className={cn(
              prState === 'merged'
                ? 'text-purple-500'
                : prState === 'open'
                  ? 'text-green-500'
                  : 'text-red-500',
            )}
          />
          <span>PR #{prNumber}</span>
        </div>

        {/* Merge button */}
        {canMerge && (
          <Button size="sm" onClick={onMerge} className="gap-1.5">
            <HugeiconsIcon icon={GitMergeIcon} size={14} />
            Accept & Merge
          </Button>
        )}

        {prState === 'merged' && (
          <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            Merged
          </span>
        )}
      </div>
    </div>
  )
}
