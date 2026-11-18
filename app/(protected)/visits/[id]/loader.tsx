import { Skeleton } from '@/components/ui/skeleton';

export default function VisitDetailPageLoader() {
  return (
    <div
      className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 xl:h-[calc(100dvh-7.5rem)] xl:min-h-[30rem]"
      aria-label="Loading Visit"
    >
      <div className="bg-card shadow-fluent-4 flex flex-none flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9" />
          <Skeleton className="size-11 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <div className="grid gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-[17rem_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3 xl:order-2 xl:min-h-0">
          <div className="grid gap-3 xl:min-h-0 xl:flex-1">
            <div className="bg-card shadow-fluent-8 flex flex-col rounded-lg border">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-1 border-b p-1.5">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="flex min-h-11 items-center gap-2 px-2.5">
                    <Skeleton className="size-6 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex-1 space-y-4 p-5">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-80 max-w-full" />
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="flex items-center justify-between gap-3 border-t p-3">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-48" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4 xl:order-1">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-7 w-full" />
          ))}
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
