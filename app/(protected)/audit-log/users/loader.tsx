import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { UserAuditTableSkeleton } from './_components/user-audit-table';

export default function UserAuditPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <Card className="py-0">
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 sm:col-span-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            {Array.from({ length: 2 }, (_, index) => (
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

      {/* The "Users" heading with its range, and the Export menu. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      <UserAuditTableSkeleton />
    </div>
  );
}
