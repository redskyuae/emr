import { Skeleton } from '@/components/ui/skeleton';

export default function PatientsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 flex flex-col gap-3 rounded-xl border p-3 lg:flex-row lg:items-center">
        <Skeleton className="h-9 w-full lg:max-w-sm" />
        <Skeleton className="h-9 w-full lg:w-40" />
        <Skeleton className="h-9 w-full lg:w-40" />
        <Skeleton className="h-9 w-full lg:ml-auto lg:w-40" />
      </div>

      <div className="bg-card shadow-fluent-2 rounded-xl border">
        <div className="space-y-2 p-4">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
