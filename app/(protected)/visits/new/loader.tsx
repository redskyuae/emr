import { Skeleton } from '@/components/ui/skeleton';

function SectionHeadingSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-64 max-w-full" />
      </div>
    </div>
  );
}

export default function CreateVisitLoader() {
  return (
    <div className="space-y-4 pb-28" aria-label="Loading Create Visit options">
      <div className="bg-card shadow-fluent-2 flex flex-wrap items-center justify-between gap-4 rounded-xl border px-5 py-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex items-center gap-3">
          {[0, 1, 2].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <div className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeadingSkeleton />
              <Skeleton className="h-9 w-72 max-w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="overflow-hidden rounded-xl border">
              <div className="flex items-center gap-4 border-b p-4">
                <Skeleton className="size-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-72 max-w-full" />
                </div>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="bg-card shadow-fluent-2 space-y-3 rounded-xl border p-4"
          aria-label="Loading Patient Treatment Plans"
        >
          <SectionHeadingSkeleton />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>

      <div className="bg-card shadow-fluent-16 fixed right-4 bottom-4 left-4 z-20 flex items-center justify-between gap-3 rounded-xl border p-3 lg:left-[calc(var(--sidebar-width)+1rem)]">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-40 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
    </div>
  );
}
