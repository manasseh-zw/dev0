import type { ReviewPRListItem } from '@/lib/types/review';
import type { ReviewStatusConfig } from './review-statuses';
import { PrLine } from './pr-line';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReviewGroupProps {
  status: ReviewStatusConfig;
  items: ReviewPRListItem[];
  count: number;
}

export function ReviewGroup({ status, items, count }: ReviewGroupProps) {
  return (
    <div className="bg-container">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-container w-full h-10">
        <div
          className="w-full h-full flex items-center justify-between px-6"
          style={{
            backgroundColor: `${status.color}08`,
          }}
        >
          <div className="flex items-center gap-2">
            <status.icon />
            <span className="text-sm font-medium">{status.name}</span>
            <span className="text-sm text-muted-foreground">{count}</span>
          </div>

          <Button className="size-6" size="icon" variant="ghost">
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* PR List */}
      <div className="space-y-0">
        {items.map((item) => (
          <PrLine
            key={item.taskId}
            item={item}
            reviewStatus={status}
            layoutId={true}
          />
        ))}
      </div>
    </div>
  );
}
