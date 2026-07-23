import { Skeleton } from '@/components/ui/skeleton';

export default function PatientDetailLoader() {
  return (
    <div className="space-y-6" aria-label="Loading page">
      <Skeleton className="h-8 w-24" />

      <div className="bg-card shadow-fluent-2 rounded-xl border p-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-32" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>

      {[0, 1, 2, 3, 4].map((section) => (
        <div key={section} className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
