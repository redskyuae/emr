import { Skeleton } from '@/components/ui/skeleton';

export default function BedBoardPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center">
        <Skeleton className="h-9 lg:w-48" />
        <Skeleton className="h-9 lg:w-44" />
      </div>

      {Array.from({ length: 2 }, (_, wardIndex) => (
        <div key={wardIndex} className="bg-card shadow-fluent-2 space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, bedIndex) => (
              <Skeleton key={bedIndex} className="min-h-28 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
