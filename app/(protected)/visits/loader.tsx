import { Skeleton } from '@/components/ui/skeleton';

export default function VisitsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 flex items-center gap-3 rounded-lg border p-4">
        <Skeleton className="size-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border p-3">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-b p-3 last:border-b-0">
            <Skeleton className="size-9 rounded-md" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="ml-auto h-8 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
