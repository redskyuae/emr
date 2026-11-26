import { AppointmentDaySectionSkeleton } from '@/app/(protected)/appointments/_components/appointment-day-section';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppointmentsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Appointments" aria-busy="true">
      {/* The same column and gap as Tabs, so the tab body starts where it will land. */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton
            className="h-10 w-[28rem] max-w-full rounded-full"
            aria-label="Loading Appointment tabs"
          />
          <Skeleton className="h-9 w-44" aria-label="Loading Book Appointment action" />
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <Skeleton className="h-10 lg:w-56" aria-label="Loading From Date filter" />
              <Skeleton className="h-10 lg:w-52" aria-label="Loading Doctor filter" />
              <Skeleton className="h-10 lg:w-52" aria-label="Loading Therapist filter" />
              <Skeleton className="h-10 lg:w-48" aria-label="Loading Appointment status filter" />
              <Skeleton className="h-10 w-full lg:max-w-xs" />
              <div className="flex gap-2 lg:ml-auto" aria-label="Loading server export actions">
                <Skeleton className="h-9 w-36" aria-label="Loading Excel download action" />
                <Skeleton className="h-9 w-36" aria-label="Loading PDF download action" />
              </div>
            </CardContent>
          </Card>

          <AppointmentDaySectionSkeleton />
        </div>
      </div>
    </div>
  );
}
