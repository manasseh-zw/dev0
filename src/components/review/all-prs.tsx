'use client';

import type { Task } from '@/lib/types';
import { useMemo } from 'react';
import { ReviewGroup } from './review-group';
import {
  reviewStatuses,
  type ReviewStatus,
} from './review-statuses';

interface AllPrsProps {
  tasks: Task[];
}

/**
 * Maps a task's status to a review status for grouping.
 * - REVIEW -> PENDING_REVIEW (purple)
 * - DONE -> ACCEPTED (green)
 * - FAILED -> REJECTED (red)
 */
function getReviewStatus(task: Task): ReviewStatus | null {
  switch (task.status) {
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

export function AllPrs({ tasks }: AllPrsProps) {
  // Filter tasks that have PRs and group by review status
  const prsByStatus = useMemo(() => {
    const result: Record<ReviewStatus, Task[]> = {
      PENDING_REVIEW: [],
      ACCEPTED: [],
      REJECTED: [],
    };

    // Only include tasks that have a PR URL
    const tasksWithPrs = tasks.filter((task) => task.prUrl);

    tasksWithPrs.forEach((task) => {
      const reviewStatus = getReviewStatus(task);
      if (reviewStatus) {
        result[reviewStatus].push(task);
      }
    });

    return result;
  }, [tasks]);

  return (
    <div className="w-full h-full overflow-y-auto">
      {reviewStatuses.map((status) => (
        <ReviewGroup
          key={status.id}
          status={status}
          tasks={prsByStatus[status.id] || []}
          count={prsByStatus[status.id]?.length || 0}
        />
      ))}
    </div>
  );
}
