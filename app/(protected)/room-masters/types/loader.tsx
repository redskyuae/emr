import { ViewSkeleton } from '@/app/(protected)/room-masters/types/_components/room-type-skeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function RoomTypesPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Room Types">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-10 w-full lg:max-w-sm" />
          <Skeleton className="h-10 w-full sm:ml-auto sm:w-44" />
        </CardContent>
      </Card>

      <ViewSkeleton layout="table" canEdit canDelete />
    </div>
  );
}
