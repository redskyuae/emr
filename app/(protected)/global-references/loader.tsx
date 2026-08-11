import { Skeleton } from '@/components/ui/skeleton';

export default function GlobalReferencesPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
