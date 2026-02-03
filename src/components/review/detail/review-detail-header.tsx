'use client'

import type { Task } from '@/lib/types'
import type { ReviewPRSummary } from '@/lib/types/review'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { GitMergeIcon, GitPullRequestIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

interface ReviewDetailHeaderProps {
  task: Task
  prDetails: ReviewPRSummary | null
}

export function ReviewDetailHeader({
  task,
  prDetails,
}: ReviewDetailHeaderProps) {
  const isMerged = prDetails?.state === 'merged'
  const prTitle = prDetails?.title ?? `PR #${task.prNumber}`

  return (
    <div className="flex items-start gap-4 px-6 py-4 border-b border-border bg-background">
      {/* PR Icon */}
      <div
        className={cn(
          'size-12 rounded-full flex items-center justify-center shrink-0',
          isMerged
            ? ' text-purple-700 dark:text-purple-500'
            : ' text-green-700 dark:text-green-500',
        )}
      >
        <HugeiconsIcon
          icon={isMerged ? GitMergeIcon : GitPullRequestIcon}
          size={24}
        />
      </div>

      {/* Title and metadata */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {prTitle}
          </h1>
          <Badge
            variant={isMerged ? 'secondary' : 'outline'}
            className={cn(
              'shrink-0',
              isMerged
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                : 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
            )}
          >
            {isMerged ? 'Merged' : 'Open'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-px">
          {task.title}
          {prDetails && (
            <span className="text-muted-foreground/60">
              {' · '}
              {prDetails.headBranch} → {prDetails.baseBranch}
            </span>
          )}
        </p>
      </div>

      {/* Stats */}
      {prDetails && (
        <div className="hidden md:flex items-center gap-6 text-center shrink-0">
          <div>
            <p className="text-lg font-semibold text-foreground">
              {prDetails.changedFiles}
            </p>
            <p className="text-xs text-muted-foreground">Files</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              +{prDetails.additions}
            </p>
            <p className="text-xs text-muted-foreground">Additions</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              -{prDetails.deletions}
            </p>
            <p className="text-xs text-muted-foreground">Deletions</p>
          </div>
        </div>
      )}
    </div>
  )
}
