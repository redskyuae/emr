import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { AdmissionsTableSkeleton } from './_components/admissions-table';

export default function AdmissionsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-full lg:w-44" />
          <Skeleton className="h-10 w-full lg:w-48" />
          <Skeleton className="h-10 w-full lg:w-52" />
          <Skeleton className="h-10 w-full lg:max-w-xs" />
          <Skeleton className="h-9 w-full sm:w-36 lg:ml-auto" />
        </CardContent>
      </Card>

      <AdmissionsTableSkeleton />
    </div>
  );
}
