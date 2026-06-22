import { Skeleton } from '@/components/ui/skeleton';

export default function LoginLoader() {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-500"
      aria-label="Loading sign-in form"
    >
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-[4px]" />
          <Skeleton className="h-4 w-52 max-w-[calc(100%-1.5rem)]" />
        </div>

        <Skeleton className="h-10 w-full" />
      </div>

      <Skeleton className="mx-auto h-4 w-56 max-w-full" />
    </div>
  );
}
