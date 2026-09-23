import { Skeleton } from '@/components/ui/skeleton';

export default function BookAppointmentLoader() {
  return (
    <div
      className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-4"
      aria-label="Loading Book Appointment"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="bg-card shadow-fluent-2 flex gap-4 rounded-xl border p-3">
        <Skeleton className="bg-primary/10 h-8 w-44" />
        <Skeleton className="h-8 w-44" />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-8 w-full" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-40" />
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-16 w-full" />
          ))}
          <div className="space-y-2 rounded-xl border p-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="bg-primary/10 h-14 w-full" />
            <Skeleton className="bg-procedure/10 h-14 w-full" />
          </div>
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-3">
              <Skeleton className="bg-procedure/10 size-9" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64 max-w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-card shadow-fluent-8 mt-auto flex items-center justify-between rounded-xl border p-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}
