import { Skeleton } from '@/components/ui/skeleton';

export default function CommunityOutreachPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Community Outreach">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-5 w-full max-w-md" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-lg" />
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-full sm:max-w-sm" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border p-3">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="ml-auto h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
