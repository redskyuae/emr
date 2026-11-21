import { ViewSkeleton } from '@/app/(protected)/appointment-masters/modes/_components/mode-skeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppointmentModesPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Appointment Modes">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-10 w-full lg:max-w-sm" />
          <Skeleton className="h-10 w-full sm:ml-auto sm:w-52" />
        </CardContent>
      </Card>

      <ViewSkeleton layout="table" canEdit canDelete />
    </div>
  );
}
