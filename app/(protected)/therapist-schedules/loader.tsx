import { TherapistScheduleViewSkeleton } from '@/app/(protected)/therapist-schedules/_components/therapist-schedule-skeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TherapistSchedulesPageLoader() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading Therapist Schedules">
      <Card>
        <CardContent className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <Skeleton className="h-10 w-56" />
          <div className="grid flex-1 gap-3 md:grid-cols-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row xl:ml-auto">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-52" />
          </div>
        </CardContent>
      </Card>

      <TherapistScheduleViewSkeleton layout="table" />
    </div>
  );
}
