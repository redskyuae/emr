import { Skeleton } from '@/components/ui/skeleton';

export default function RolesPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-9 w-32" />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="bg-card shadow-fluent-2 flex min-h-52 flex-col gap-4 rounded-lg border p-4"
          >
            <div className="flex gap-3">
              <Skeleton className="size-11 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="mt-auto flex gap-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
