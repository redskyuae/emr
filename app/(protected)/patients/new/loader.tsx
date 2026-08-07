import { Skeleton } from '@/components/ui/skeleton';

export default function PatientRegistrationLoader() {
  return (
    <div className="space-y-6" aria-label="Loading page">
      {[0, 1, 2, 3, 4, 5].map((section) => (
        <div key={section} className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          {/* The Identifiers card carries the Emirates ID row and the repeatable
              Identity Documents list, so it is taller than the others. */}
          {section === 0 ? (
            <>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-9 w-full sm:w-1/2" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-9 w-48" />
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}
