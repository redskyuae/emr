import { ViewSkeleton } from '@/app/(protected)/rooms/_components/room-skeletons';
import { RoomSummaryCardsSkeleton } from '@/app/(protected)/rooms/_components/room-summary-cards';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function RoomsPageLoader() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading Rooms">
      <RoomSummaryCardsSkeleton />

      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-full lg:max-w-xs" />
          <Skeleton className="h-10 w-full lg:w-40" />
          <Skeleton className="h-10 w-full lg:w-44" />
          <Skeleton className="h-10 w-full lg:ml-auto lg:w-32" />
        </CardContent>
      </Card>

      <ViewSkeleton layout="table" />
    </div>
  );
}
