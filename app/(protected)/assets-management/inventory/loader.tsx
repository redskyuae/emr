import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryLoader() {
  return (
    <div className="space-y-6" aria-label="Loading asset inventory">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="bg-card shadow-fluent-2 rounded-lg border">
        <div className="grid gap-3 border-b p-4 md:grid-cols-5">
          <Skeleton className="h-10 w-full md:col-span-2" />
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-10 w-full" />
          ))}
        </div>
        <div className="space-y-2 p-4">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
