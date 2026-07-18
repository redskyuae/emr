import { Skeleton } from '@/components/ui/skeleton';

export default function InvoiceDetailLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-56 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
