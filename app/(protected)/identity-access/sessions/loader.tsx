import { Skeleton } from '@/components/ui/skeleton';

export default function SessionsPageLoader() {
  return (
    <div className="space-y-6" aria-label="Loading page">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-32 w-full" />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <div className="bg-card shadow-fluent-2 space-y-3 rounded-lg border p-4 xl:col-span-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="space-y-2 pt-2">
            {[0, 1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="bg-card shadow-fluent-2 space-y-3 rounded-lg border p-4 xl:col-span-2">
          <Skeleton className="h-6 w-40" />
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-16 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
