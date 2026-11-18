import { Skeleton } from '@/components/ui/skeleton';

export default function BillingCounterPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Billing Counter">
      <Skeleton className="h-16 rounded-lg" />

      <div className="bg-card space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-6 w-40 lg:ml-auto" />
        </div>
        <div className="grid grid-cols-2 gap-3 border-t pt-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-10" />
          ))}
        </div>
      </div>

      <Skeleton
        className="h-10 w-[44rem] max-w-full rounded-full"
        aria-label="Loading Billing Counter tabs"
      />

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
