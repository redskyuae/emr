import { Skeleton } from '@/components/ui/skeleton';

export default function AdmissionsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center">
        <Skeleton className="h-9 lg:w-44" />
        <Skeleton className="h-9 lg:w-48" />
        <Skeleton className="h-9 lg:w-52" />
        <Skeleton className="h-9 w-full lg:max-w-xs" />
        <div className="flex gap-2 lg:ml-auto">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border p-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="ml-auto h-8 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
