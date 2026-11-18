import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { PreviousVisitsTableSkeleton } from './_components/previous-visits-table';

export default function PreviousVisitsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <Card className="py-0">
        <CardContent className="space-y-4 p-4">
          <div className="w-full space-y-2 xl:max-w-md">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>

      <PreviousVisitsTableSkeleton />
    </div>
  );
}
