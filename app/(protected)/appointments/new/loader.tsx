import { Skeleton } from '@/components/ui/skeleton';

export default function BookAppointmentLoader() {
  return (
    <div
      className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-4"
      aria-label="Loading booking"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="bg-card flex gap-4 rounded-xl border p-3">
        <Skeleton className="bg-primary/10 h-8 w-44" />
        <Skeleton className="h-8 w-44" />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="bg-card space-y-4 rounded-xl border p-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-8 w-full" />
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
        <div className="bg-card space-y-4 rounded-xl border p-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="bg-primary/10 h-14 w-full" />
            <Skeleton className="bg-procedure/10 h-14 w-full" />
          </div>
          <div className="space-y-2 border-t pt-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
      <div className="bg-card mt-auto flex items-center justify-between rounded-xl border p-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}
