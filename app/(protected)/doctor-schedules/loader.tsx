import { Skeleton } from '@/components/ui/skeleton';

export default function DoctorSchedulesPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 rounded-lg border p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="grid flex-1 gap-3 md:grid-cols-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="flex gap-2 xl:ml-auto">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-44" />
          </div>
        </div>
      </div>

      <div className="bg-card shadow-fluent-2 rounded-lg border">
        <div className="space-y-2 p-4">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} className="h-11 w-full" />
          ))}
        </div>
        <div className="flex items-center justify-between border-t p-3">
          <Skeleton className="h-5 w-44" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
