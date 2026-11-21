import { Skeleton } from '@/components/ui/skeleton';

// Mirrors the page: the toolbar over the A4 report sheet.
export default function ConsolidatedReportLoader() {
  return (
    <div className="flex flex-col gap-4" aria-label="Loading page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-44" />
      </div>

      <div className="bg-card mx-auto w-full max-w-[210mm] space-y-7 rounded-lg border px-5 py-8 sm:px-12 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-6 border-b-2 pb-5">
          <div className="flex items-center gap-3.5">
            <Skeleton className="size-12 rounded-xl" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="ml-auto w-52 max-w-full space-y-1.5">
            <Skeleton className="ml-auto h-3 w-44 max-w-full" />
            <Skeleton className="ml-auto h-3 w-52 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
