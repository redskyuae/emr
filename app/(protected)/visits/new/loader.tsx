import { Skeleton } from '@/components/ui/skeleton';

export default function VisitNewPageLoader() {
  return (
    <div className="space-y-6" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}
