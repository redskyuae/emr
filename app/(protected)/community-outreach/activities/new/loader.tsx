import { Skeleton } from '@/components/ui/skeleton';

export default function LogActivityPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Log activity">
      <div className="space-y-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-56 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}
