import { Skeleton } from '@/components/ui/skeleton';

import { ConsultationSkeleton } from './_components/visit-consultation-panel';

function PaneSectionSkeleton({ lines }: { lines: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="size-6 rounded-md" />
        <Skeleton className="h-3 w-28" />
      </div>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className="h-4 w-full max-w-48" />
      ))}
    </div>
  );
}

export default function VisitDetailPageLoader() {
  return (
    <div
      className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 xl:h-[calc(100dvh-7.5rem)] xl:min-h-[30rem]"
      aria-label="Loading Visit"
    >
      <div className="bg-card flex flex-none flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9" />
          <Skeleton className="size-11 rounded-lg" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>

      <div className="grid gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-[17rem_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)]">
        <div className="min-w-0 xl:order-2 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:p-0.5">
          <ConsultationSkeleton stepCount={5} />
        </div>

        <div className="bg-card flex flex-col rounded-lg border xl:order-1 xl:min-h-0">
          <div className="border-b p-1.5">
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
          <div className="space-y-5 p-4">
            <PaneSectionSkeleton lines={5} />
            <PaneSectionSkeleton lines={1} />
            <PaneSectionSkeleton lines={1} />
            <PaneSectionSkeleton lines={1} />
          </div>
        </div>
      </div>
    </div>
  );
}
