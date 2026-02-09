import { ReviewFilters } from '@/components/review/review-filters'

export function ReviewSubHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 lg:px-6 py-3 border-b border-border bg-background">
      <div className="flex items-center gap-2 shrink-0">
        <ReviewFilters />
      </div>
    </div>
  )
}
