import { Skeleton } from '@/components/ui/skeleton';

export default function ClinicianAssessmentLoader() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-4 pb-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-4 grid gap-3 rounded-lg border p-3 md:grid-cols-2 md:p-4 xl:grid-cols-[1.35fr_1fr_1fr]">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-56 max-w-full" />
          <Skeleton className="h-3 w-48 max-w-full" />
          <Skeleton className="h-3 w-60 max-w-full" />
        </div>
        <Skeleton className="h-14 w-full md:col-span-2 xl:col-span-1" />
      </div>

      <div className="bg-card shadow-fluent-2 space-y-3 rounded-lg border p-3 md:p-4">
        <div className="flex justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </div>

      <div className="bg-card shadow-fluent-2 space-y-4 rounded-lg border p-4">
        <div className="space-y-2 border-b pb-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 9 }, (_, index) => (
            <div className="space-y-2" key={index}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>

      <div className="bg-card shadow-fluent-8 flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center">
        <Skeleton className="h-7 w-64 max-w-full" />
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-40" />
        </div>
      </div>
    </div>
  );
}
