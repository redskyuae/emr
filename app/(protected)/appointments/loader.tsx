import { Skeleton } from '@/components/ui/skeleton';

export default function AppointmentsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Appointments">
      <div className="bg-card shadow-fluent-2 flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center">
        <Skeleton className="h-9 lg:w-44" />
        <Skeleton className="h-9 lg:w-52" />
        <Skeleton className="h-9 lg:w-48" aria-label="Loading Appointment status filter" />
        <Skeleton className="h-9 w-full lg:max-w-xs" />
      </div>

      {Array.from({ length: 2 }, (_, sectionIndex) => (
        <section key={sectionIndex} className="space-y-2" aria-label="Loading appointments">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-5 w-8" />
          </div>
          <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border p-3">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="ml-auto h-8 w-10" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
