import { Skeleton } from '@/components/ui/skeleton';

// Mirrors the A4 sheet: letterhead, details box, the plan tables and the Visit table.
export function ReportDocumentSkeleton() {
  return (
    <div
      aria-label="Generating report"
      className="bg-card mx-auto w-full max-w-[210mm] space-y-7 rounded-lg border px-5 py-8 sm:px-12 sm:py-10"
    >
      <div className="flex items-center justify-between gap-6 border-b-2 pb-5">
        <div className="flex items-center gap-3.5">
          <Skeleton className="size-12 rounded-xl" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="ml-auto h-3 w-44" />
          <Skeleton className="ml-auto h-3 w-52" />
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
