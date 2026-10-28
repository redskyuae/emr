import { Skeleton } from '@/components/ui/skeleton';

export default function BillingCounterPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 space-y-3 rounded-lg border p-3">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-6 w-40 lg:ml-auto" />
        </div>
        <div className="grid grid-cols-2 gap-3 border-t pt-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-9" />
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-28" />
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}
