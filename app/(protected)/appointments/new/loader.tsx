import { Skeleton } from '@/components/ui/skeleton';

export default function BookAppointmentLoader() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]" aria-label="Loading page">
      <div className="space-y-4">
        {[0, 1, 2].map((section) => (
          <div key={section} className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
            <Skeleton className="h-5 w-44" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
      <div className="bg-card shadow-fluent-2 h-fit space-y-4 rounded-xl border p-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
