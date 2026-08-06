import { Skeleton } from '@/components/ui/skeleton';

export default function CountriesPageLoader() {
  return <GlobalReferenceLoader />;
}

function GlobalReferenceLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-full lg:max-w-sm" />
        <div className="flex gap-2 lg:ml-auto">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="bg-card shadow-fluent-2 h-80 rounded-lg border p-4">
        <div className="space-y-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
