import { MaintenanceStatCardsSkeleton } from '@/app/(protected)/assets-management/maintenance/_components/maintenance-stat-cards';
import { WorkOrderQueueTableSkeleton } from '@/app/(protected)/assets-management/maintenance/_components/work-order-queue-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PageLoader() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading maintenance">
      <MaintenanceStatCardsSkeleton />

      <div className="space-y-1">
        <h2 className="text-lg leading-tight font-semibold">Work Orders</h2>
        <div className="flex h-5 items-center">
          <Skeleton className="h-3.5 w-56" />
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div>
            <CardTitle>Maintenance queue</CardTitle>
            <CardDescription>Work Orders raised against tracked Assets.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
            <Skeleton className="h-10 w-full 2xl:max-w-sm" />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-24" />
              ))}
            </div>
            <Skeleton className="h-9 w-full sm:w-40 2xl:ml-auto" />
          </div>

          <WorkOrderQueueTableSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}
