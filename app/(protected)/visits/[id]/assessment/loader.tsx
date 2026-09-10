import { Skeleton } from '@/components/ui/skeleton';

export default function ClinicianAssessmentLoader() {
  return (
    <div
      className="grid h-[calc(100svh-7.5rem)] min-h-0 grid-rows-[4rem_minmax(0,1fr)_3.5rem] gap-2 overflow-hidden"
      aria-label="Loading page"
    >
      <div className="bg-card shadow-fluent-2 flex h-16 items-center gap-4 rounded-lg border p-3">
        <Skeleton className="size-11 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="ml-auto h-10 w-80" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="bg-card shadow-fluent-2 space-y-3 overflow-hidden rounded-lg border p-3 [@media(max-height:900px)]:overflow-y-auto"
          >
            <Skeleton className="h-6 w-28" />
            {Array.from({ length: 6 }, (_, row) => (
              <Skeleton key={row} className="h-12 w-full" />
            ))}
          </div>
        ))}
      </div>
      <div className="bg-card shadow-fluent-8 flex h-14 items-center gap-3 rounded-lg border p-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="ml-auto h-8 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}
