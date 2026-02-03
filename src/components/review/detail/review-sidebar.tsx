'use client'

import type { Task } from '@/lib/types'
import type { MockPRDetails } from '@/data/mock/pr-details'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  UserIcon,
  ViewIcon,
  LinkSquare01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

interface ReviewSidebarProps {
  task: Task
  prDetails: MockPRDetails | null
}

export function ReviewSidebar({ task, prDetails }: ReviewSidebarProps) {
  const isMerged = prDetails?.state === 'merged'
  const isOpen = prDetails?.state === 'open'

  return (
    <div className="w-72 shrink-0 border-l border-border bg-muted/30 p-6 space-y-4 hidden lg:block overflow-y-auto">
      {/* Review Now Button */}
      <Button
        size="lg"
        className={cn(
          'w-full  text-sm font-medium gap-2',
          isMerged && 'opacity-50 cursor-not-allowed',
        )}
        disabled={isMerged}
      >
        <HugeiconsIcon icon={ViewIcon} size={18} />
        {isMerged ? 'Already Merged' : 'Review Now'}
      </Button>

      {/* View on GitHub */}
      {task.prUrl && (
        <a
          href={task.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-8 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg hover:bg-muted"
        >
          <HugeiconsIcon icon={LinkSquare01Icon} size={16} />
          View on GitHub
        </a>
      )}

      {/* Status section */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Status
        </h3>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'size-2.5 rounded-full',
              isMerged
                ? 'bg-purple-500'
                : isOpen
                  ? 'bg-green-500'
                  : 'bg-muted-foreground',
            )}
          />
          <span className="text-sm font-medium">
            {isMerged ? 'Merged' : isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Authored By section */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Authored By
        </h3>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
            <img src="/favicon.svg" alt="Dev0 Agent" className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Dev0 Agent</p>
            <p className="text-xs text-muted-foreground">AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Reviewed By section */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Reviewed By
        </h3>
        {isMerged ? (
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-muted flex items-center justify-center">
              <HugeiconsIcon
                icon={UserIcon}
                size={16}
                className="text-muted-foreground"
              />
            </div>
            <div>
              <p className="text-sm font-medium">You</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Awaiting review...
          </p>
        )}
      </div>

      {/* Branch Info */}
      {prDetails && (
        <div className="pt-4 border-t border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Branches
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">From</span>
              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                {prDetails.headBranch}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">To</span>
              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                {prDetails.baseBranch}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
