import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { PreviousVisitsTableSkeleton } from './_components/previous-visits-table';

export default function PreviousVisitsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-full sm:w-auto sm:min-w-64 sm:flex-1 lg:max-w-sm" />
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Skeleton className="h-10 flex-1 sm:w-40 sm:flex-none" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-10 flex-1 sm:w-40 sm:flex-none" />
          </div>
          <Skeleton className="h-10 w-44" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-36" />
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
