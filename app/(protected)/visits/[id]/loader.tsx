import { Skeleton } from '@/components/ui/skeleton';

export default function VisitDetailPageLoader() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5" aria-label="Loading Visit">
      <div className="bg-card shadow-fluent-2 space-y-5 rounded-lg border p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <Skeleton className="size-12 rounded-xl" />
            <div className="space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-80 max-w-full" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
        <div className="grid gap-3 border-t pt-5 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-6 overflow-hidden border-b pb-3">
        {[120, 70, 130, 65, 90].map((width) => (
          <Skeleton key={width} className="h-5 shrink-0" style={{ width }} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-5">
          {[220, 280].map((height) => (
            <div
              key={height}
              className="bg-card shadow-fluent-2 space-y-4 rounded-lg border p-5"
              style={{ minHeight: height }}
            >
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-12 w-1/2" />
            </div>
          ))}
        </div>
        <div className="space-y-5">
          <div className="bg-card shadow-fluent-2 space-y-4 rounded-lg border p-5">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
          <div className="bg-card shadow-fluent-2 rounded-lg border p-5">
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
