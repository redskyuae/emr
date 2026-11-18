import { InvoiceTableSkeleton } from '@/app/(protected)/billing/_components/invoice-table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// The Invoice list: the search and status toolbar (with New Invoice) over the table skeleton.
// A `?invoice=new` visit shows the composer's own skeleton once the page has mounted.
export default function BillingPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-full lg:max-w-sm" />
          <Skeleton className="h-10 w-full lg:w-48" />
          <Skeleton className="h-9 w-full sm:ml-auto sm:w-32" />
        </CardContent>
      </Card>

      <InvoiceTableSkeleton />
    </div>
  );
}
