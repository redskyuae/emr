import { Skeleton } from '@/components/ui/skeleton';

export default function SwaggerLoader() {
  return (
    <main
      className="bg-background min-h-screen space-y-4 p-6"
      aria-label="Loading API documentation"
    >
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-14 w-full" />
      <div className="grid gap-4 lg:grid-cols-4">
        <Skeleton className="h-dvh w-full lg:col-span-1" />
        <Skeleton className="h-dvh w-full lg:col-span-3" />
      </div>
    </main>
  );
}
