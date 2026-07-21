import { Skeleton } from '@/components/ui/skeleton';

export default function VisitDetailPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 space-y-4 rounded-lg border p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="size-8 rounded-md" />
            </div>
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card shadow-fluent-2 space-y-3 rounded-lg border p-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="bg-card shadow-fluent-2 space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>

      <div className="bg-card shadow-fluent-2 space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
