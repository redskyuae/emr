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
      {/* The page header: the booking instructions. */}
      <Skeleton className="h-4 w-80 max-w-full" />

      <BookAppointmentWorkflowSkeleton />
    </div>
  );
}
