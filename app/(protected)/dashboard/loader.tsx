import { Skeleton } from '@/components/ui/skeleton';

export default function PageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Appointment Dashboard" aria-busy="true">
      <section className="from-primary/10 via-card to-procedure/10 border-primary/20 shadow-fluent-2 flex items-center gap-3 rounded-lg border bg-gradient-to-br p-3 sm:p-4">
        <Skeleton className="size-9 shrink-0 rounded-md" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="hidden h-8 w-32 sm:block" />
      </section>

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="bg-card shadow-fluent-2 space-y-1 rounded-lg border p-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-14" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </section>

      <section className="grid items-start gap-3 xl:grid-cols-3">
        <div className="bg-card shadow-fluent-2 rounded-lg border xl:col-span-2">
          <div className="space-y-1 border-b p-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-52 max-w-full" />
          </div>
          <div className="space-y-1 p-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="bg-card shadow-fluent-2 space-y-3 rounded-lg border p-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-12 w-full" />
        </div>
      </section>
    </div>
  );
}
