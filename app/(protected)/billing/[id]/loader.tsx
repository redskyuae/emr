import { InvoiceDetailBodySkeleton } from '@/app/(protected)/billing/[id]/_components/invoice-detail-impl';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvoiceDetailLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      {/* The header card: back button, Invoice number and status, "Invoice for" line, actions. */}
      <div className="bg-card flex flex-col gap-4 rounded-xl border p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Skeleton className="size-9" />
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="pl-11">
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-11 lg:pl-0">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      <InvoiceDetailBodySkeleton />
    </div>
  );
}
