import { Skeleton } from '@/components/ui/skeleton';

// Mirrors the PermissionMatrix: a section header with its granted count, then one row per
// resource with a checkbox + action label (and description line) per Permission.
export function PermissionMatrixSkeleton() {
  return (
    <div className="space-y-7">
      {[0, 1, 2].map((section) => (
        <section key={section} className="space-y-3">
          <div className="flex items-center justify-between gap-3 border-b pb-2">
            <div className="flex h-4 items-center">
              <Skeleton className="h-3 w-36" />
            </div>
            <div className="flex h-4 items-center">
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="divide-y rounded-md border">
            {[0, 1, 2].map((resource) => (
              <div key={resource} className="grid gap-3 p-3 md:grid-cols-3 md:items-start">
                <div className="flex h-6 items-center">
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 md:col-span-2 xl:grid-cols-3">
                  {[0, 1, 2, 3].map((action) => (
                    <div key={action} className="flex min-h-7 items-start gap-2">
                      <Skeleton className="size-4 shrink-0 rounded-[4px]" />
                      <div className="grid flex-1 gap-0.5">
                        <div className="flex h-5 items-center">
                          <Skeleton className="h-3.5 w-16" />
                        </div>
                        <div className="flex h-4 items-center">
                          <Skeleton className="h-3 w-full max-w-36" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
