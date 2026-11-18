import { StatCardSkeleton } from '@/components/app/stat-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function VisitsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center">
        <Skeleton className="h-10 lg:w-44" />
        <Skeleton className="h-10 lg:w-52" aria-label="Loading Doctor filter" />
        <Skeleton className="h-10 w-full lg:ml-auto lg:max-w-xs" />
      </div>

      <div className="bg-card overflow-hidden rounded-xl border p-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
            <Skeleton className="size-9 rounded-md" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="ml-auto h-8 w-20" />
            <Skeleton className="h-8 w-9" aria-label="Loading Visit actions" />
          </div>
        ))}
      </div>
    </div>
  );
}
