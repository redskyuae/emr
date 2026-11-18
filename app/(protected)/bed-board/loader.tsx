import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { BedBoardSkeleton } from './_components/bed-board-impl';

export default function BedBoardPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-full lg:w-48" />
          <Skeleton className="h-10 w-full lg:w-44" />
        </CardContent>
      </Card>

      <BedBoardSkeleton />
    </div>
  );
}
