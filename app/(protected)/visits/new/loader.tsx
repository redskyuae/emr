import { Skeleton } from '@/components/ui/skeleton';

export default function CreateVisitLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Create Visit">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-64" />
      </div>

      <div className="bg-card shadow-fluent-2 space-y-3 rounded-xl border p-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-7 w-full max-w-44" />
          <Skeleton className="h-7 w-full max-w-44" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {[0, 1, 2, 3, 4, 5, 6].map((section) => (
            <div key={section} className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {[0, 1, 2].map((section) => (
            <div key={section} className="bg-card shadow-fluent-2 space-y-3 rounded-xl border p-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
