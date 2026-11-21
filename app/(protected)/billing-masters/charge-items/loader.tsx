import { ChargeItemTableSkeleton } from '@/app/(protected)/billing-masters/charge-items/_components/charge-item-table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChargeItemsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Charge Items">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-full lg:max-w-sm" />
          <Skeleton className="h-10 w-full lg:w-48" />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
            <Skeleton className="h-9 w-40" />
          </div>
        </CardContent>
      </Card>

      <ChargeItemTableSkeleton canEdit canDelete />
    </div>
  );
}
