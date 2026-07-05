import { Skeleton } from '@/components/ui/skeleton';

export default function OnboardingLoader() {
  return (
    <div className="flex min-h-svh flex-1 flex-col" aria-label="Loading workspace setup">
      <div className="flex items-center p-6">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
