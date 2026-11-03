import { Skeleton } from '@/components/ui/skeleton';

export default function ActivityDetailPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading activity">
      <Skeleton className="h-4 w-56" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-7 w-full max-w-lg" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-44 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
        <Skeleton className="h-44 rounded-lg" />
      </div>
    </div>
  );
}
