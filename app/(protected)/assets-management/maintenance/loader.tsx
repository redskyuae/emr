import { Skeleton } from '@/components/ui/skeleton';

export default function PageLoader() {
  return (
    <div className="space-y-6" aria-label="Loading page">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="bg-card shadow-fluent-2 flex min-h-36 flex-col justify-between rounded-lg border p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-9 rounded-md" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </section>

      <div className="space-y-1">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>

      <section className="bg-card shadow-fluent-2 rounded-lg border">
        <div className="space-y-2 border-b p-6">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
            <Skeleton className="h-9 w-full 2xl:max-w-sm" />
            <div className="flex flex-wrap gap-1.5">
              {[0, 1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-8 w-24 rounded-md" />
              ))}
            </div>
            <Skeleton className="h-9 w-full sm:w-40 2xl:ml-auto" />
          </div>

          <div className="overflow-hidden rounded-md border">
            <div className="grid grid-cols-8 gap-4 border-b px-4 py-3">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
                <Skeleton key={item} className="h-4 w-full" />
              ))}
            </div>
            <div className="divide-y">
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className="grid grid-cols-8 gap-4 px-4 py-4">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((cell) => (
                    <Skeleton key={cell} className="h-4 w-full" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
