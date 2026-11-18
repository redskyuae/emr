import { StatCardSkeleton } from '@/components/app/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { VisitsTableSkeleton } from './_components/visits-table';

export default function VisitsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      <Card className="py-0">
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-full lg:w-44" />
          <Skeleton className="h-10 w-full lg:w-52" aria-label="Loading Doctor filter" />
          <Skeleton className="h-10 w-full lg:ml-auto lg:max-w-xs" />
        </CardContent>
      </Card>

      <VisitsTableSkeleton />
    </div>
  );
}
