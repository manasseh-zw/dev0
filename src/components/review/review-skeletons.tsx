import { Skeleton } from '@/components/ui/skeleton'

export function ReviewListSkeleton() {
  return (
    <div className="w-full h-full overflow-y-auto">
      {/* Pending Review Group */}
      <div className="border-b border-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
        <div className="px-4 pb-3 space-y-2">
          <ReviewListItemSkeleton />
          <ReviewListItemSkeleton />
        </div>
      </div>
      {/* Accepted Group */}
      <div className="border-b border-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
        <div className="px-4 pb-3 space-y-2">
          <ReviewListItemSkeleton />
        </div>
      </div>
      {/* Rejected Group */}
      <div className="border-b border-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function ReviewListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
      <Skeleton className="size-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  )
}

export function ReviewDetailSkeleton() {
  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
      {/* Header skeleton */}
      <div className="flex items-start gap-4 px-6 py-4 border-b border-border bg-background">
        <Skeleton className="size-12 rounded-full shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="text-center space-y-1">
            <Skeleton className="h-6 w-8 mx-auto" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="text-center space-y-1">
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="text-center space-y-1">
            <Skeleton className="h-6 w-10 mx-auto" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 p-6 space-y-4">
          <div className="flex gap-2 border-b border-border pb-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l border-border p-4 space-y-4 hidden lg:block">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
