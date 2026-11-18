import { WardTableSkeleton } from '@/app/(protected)/inpatient-masters/wards/_components/ward-table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function WardsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Wards">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-full lg:max-w-sm" />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </Card>

      <WardTableSkeleton canEdit canDelete />
    </div>
  );
}
