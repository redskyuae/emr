import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoader() {
  return (
    <main
      className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center space-y-6 px-6 py-16"
      aria-label="Loading sign-in page"
    >
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64 max-w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </main>
  );
}
