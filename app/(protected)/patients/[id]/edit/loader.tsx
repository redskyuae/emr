import { Skeleton } from '@/components/ui/skeleton';

export default function PatientEditLoader() {
  return (
    <div className="space-y-6" aria-label="Loading page">
      <Skeleton className="h-8 w-32" />

      {[0, 1, 2, 3, 4].map((section) => (
        <div key={section} className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
