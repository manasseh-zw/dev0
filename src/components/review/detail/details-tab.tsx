import type { Task } from '@/lib/types'
import type { ReviewPRSummary } from '@/lib/types/review'
import { MessageResponse } from '@/components/ai-elements/message'
import { format } from 'date-fns'
import { UserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

interface DetailsTabProps {
  task: Task
  prDetails: ReviewPRSummary | null
}

// We keep task in props for future use (e.g., showing task-specific info)
export function DetailsTab({ task: _task, prDetails }: DetailsTabProps) {
  if (!prDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <p className="text-sm text-muted-foreground">
          No PR details available for this task.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* PR Body */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <MessageResponse>{prDetails.body ?? ''}</MessageResponse>
      </div>

      {/* Comments section */}
      {prDetails.comments.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border">
          <h3 className="text-sm font-medium text-foreground">
            Comments ({prDetails.comments.length})
          </h3>
          <div className="space-y-4">
            {prDetails.comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-4 rounded-lg bg-muted/50 border border-border"
              >
                {/* Avatar */}
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {comment.authorType === 'agent' ? (
                    <img
                      src="/favicon.svg"
                      alt="Dev0 Agent"
                      className="size-5"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={UserIcon}
                      size={16}
                      className="text-primary"
                    />
                  )}
                </div>

                {/* Comment content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {comment.author}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(
                        new Date(comment.createdAt),
                        'MMM d, yyyy h:mm a',
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {comment.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
