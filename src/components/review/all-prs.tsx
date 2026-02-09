import type { ReviewPRListItem } from '@/lib/types/review';
import { useMemo } from 'react';
import { ReviewGroup } from './review-group';
import {
  reviewStatuses,
  type ReviewStatus,
} from './review-statuses';

interface AllPrsProps {
  items: ReviewPRListItem[];
}

/**
 * Maps a task's status to a review status for grouping.
 * - REVIEW -> PENDING_REVIEW (purple)
 * - DONE -> ACCEPTED (green)
 * - FAILED -> REJECTED (red)
 */
function getReviewStatus(item: ReviewPRListItem): ReviewStatus | null {
  switch (item.taskStatus) {
    case 'REVIEW':
      return 'PENDING_REVIEW';
    case 'DONE':
      return 'ACCEPTED';
    case 'FAILED':
      return 'REJECTED';
    default:
      return null; // Tasks not in review states are excluded
  }
}

export function AllPrs({ items }: AllPrsProps) {
  // Filter tasks that have PRs and group by review status
  const prsByStatus = useMemo(() => {
    const result: Record<ReviewStatus, ReviewPRListItem[]> = {
      PENDING_REVIEW: [],
      ACCEPTED: [],
      REJECTED: [],
    };

    items.forEach((item) => {
      const reviewStatus = getReviewStatus(item);
      if (reviewStatus) {
        result[reviewStatus].push(item);
      }
    });

    return result;
  }, [items]);

  return (
    <div className="w-full h-full overflow-y-auto">
      {reviewStatuses.map((status) => (
        <ReviewGroup
          key={status.id}
          status={status}
          items={prsByStatus[status.id] || []}
          count={prsByStatus[status.id]?.length || 0}
        />
      ))}
    </div>
  );
}
