import { AppointmentDashboardContentSkeleton } from '@/app/(protected)/dashboard/_components/appointment-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function PageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Appointment Dashboard" aria-busy="true">
      {/* The heading row: "Today's Appointments", the date line and Open Appointments. */}
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex h-7 items-center">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex h-5 items-center">
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <Skeleton className="hidden h-9 w-44 sm:block" />
      </section>

      <AppointmentDashboardContentSkeleton />
    </div>
  );
}
