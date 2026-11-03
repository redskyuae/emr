import { Skeleton } from '@/components/ui/skeleton';

export default function ReassignPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Reassign contact">
      <Skeleton className="h-4 w-56" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="bg-card shadow-fluent-2 grid gap-4 rounded-lg border p-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-11 w-full md:col-span-2" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
