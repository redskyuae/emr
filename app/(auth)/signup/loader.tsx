import { Skeleton } from '@/components/ui/skeleton';

export default function SignupLoader() {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-500"
      aria-label="Loading signup form"
    >
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="flex items-start gap-2">
          <Skeleton className="mt-0.5 size-4 rounded-sm" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        <Skeleton className="h-10 w-full" />
      </div>

      <Skeleton className="mx-auto h-4 w-48 max-w-full" />
    </div>
  );
}
