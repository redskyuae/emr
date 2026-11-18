import { BookAppointmentWorkflowSkeleton } from '@/app/(protected)/appointments/new/_components/book-appointment-page-impl';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookAppointmentLoader() {
  return (
    <div
      className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-4"
      aria-label="Loading Book Appointment"
      aria-busy="true"
      role="status"
    >
      {/* The page header: the instructions and the Facility with its time zone. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-80 max-w-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </div>

      <BookAppointmentWorkflowSkeleton />
    </div>
  );
}
