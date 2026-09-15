import { Skeleton } from '@/components/ui/skeleton';

export default function RescheduleAppointmentLoader() {
  return (
    <div
      className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-4"
      aria-label="Loading Reschedule Appointment"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
      <div className="bg-card shadow-fluent-8 mt-auto flex items-center justify-between rounded-xl border p-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-9 w-44" />
      </div>
    </div>
  );
}
