import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { UserAuditDetailSkeleton } from './_components/user-audit-detail-impl';
import { UserAuditHeaderSkeleton } from './_components/user-audit-header';

export default function UserAuditDetailLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      {/* The "User Audit Events" back link. */}
      <Skeleton className="h-8 w-40" />

      <UserAuditHeaderSkeleton />

      <Card className="py-0">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:max-w-xl">
            {Array.from({ length: 2 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row lg:ml-auto lg:pt-6">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* The range label and the Export menu. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-24" />
      </div>

      <UserAuditDetailSkeleton />
    </div>
  );
}
