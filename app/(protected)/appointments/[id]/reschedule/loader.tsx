import {
  RescheduleAppointmentBodySkeleton,
  RescheduleTenantSkeleton,
} from '@/app/(protected)/appointments/[id]/reschedule/_components/reschedule-appointment-page-impl';
import { Skeleton } from '@/components/ui/skeleton';

export default function RescheduleAppointmentLoader() {
  return (
    <div
      className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-4"
      aria-label="Loading Reschedule Appointment"
    >
      {/* The header: the back link and booking line, with the Tenant on the right. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <RescheduleTenantSkeleton />
      </div>

      <RescheduleAppointmentBodySkeleton />
    </div>
  );
}
