import { Skeleton } from '@/components/ui/skeleton';

import { VisitSummarySheetSkeleton } from './_components/visit-summary-skeleton';

export default function VisitSummaryPageLoader() {
  return (
    <div className="flex flex-col gap-4" aria-label="Loading Visit Summary">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-48" />
      </div>
      <VisitSummarySheetSkeleton />
    </div>
  );
}
