import { Skeleton } from '@/components/ui/skeleton';

/** One A4 sheet: letterhead, Patient card and a few printed sections. */
export function VisitSummarySheetSkeleton() {
  return (
    <div className="bg-card mx-auto w-full max-w-[210mm] space-y-5 rounded-sm border px-6 py-8 sm:px-12">
      <div className="flex items-start justify-between gap-6 border-b-2 pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="ml-auto h-7 w-40" />
          <Skeleton className="ml-auto h-5 w-32" />
        </div>
      </div>
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      {[4, 6, 3].map((lines, section) => (
        <div key={section} className="space-y-2.5">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: lines }, (_, line) => (
            <Skeleton key={line} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
