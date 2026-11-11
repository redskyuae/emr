import { Skeleton } from '@/components/ui/skeleton';

export default function VisitDetailPageLoader() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-4" aria-label="Loading Visit">
      <Skeleton className="h-14 w-full" aria-label="Loading Patient safety information" />
      <div className="bg-card shadow-fluent-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="size-9" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>
      <div className="bg-card shadow-fluent-2 flex flex-wrap gap-x-6 gap-y-3 rounded-lg border px-4 py-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex min-w-32 flex-1 items-center gap-2">
            <Skeleton className="size-6 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-3">
          <div className="flex gap-6 overflow-hidden border-b pb-3">
            {[90, 90, 110, 110, 60, 80].map((width, index) => (
              <Skeleton key={index} className="h-5 shrink-0" style={{ width }} />
            ))}
          </div>
          {[200, 240, 200].map((height, index) => (
            <div
              key={index}
              className="bg-card shadow-fluent-2 space-y-4 rounded-lg border p-5"
              style={{ minHeight: height }}
            >
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[160, 140, 200].map((height, index) => (
            <div
              key={index}
              className="bg-card shadow-fluent-2 space-y-3 rounded-lg border p-5"
              style={{ minHeight: height }}
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
