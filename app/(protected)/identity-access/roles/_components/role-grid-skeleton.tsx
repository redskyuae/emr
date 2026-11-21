import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Mirrors a grid of RoleCards: icon tile, name, code badge, two-line description, then the
 * staff and permission counts with the Edit action. `canEdit` matches the action the loaded
 * cards render; the route loader cannot know the permission yet, so it keeps the default.
 */
export function RoleGridSkeleton({ canEdit = true }: { canEdit?: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <Card key={item}>
          <CardContent className="flex min-h-52 flex-col gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <Skeleton className="size-11 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex h-6 items-center">
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
                <div>
                  <div className="flex h-5 items-center">
                    <Skeleton className="h-3.5 w-full" />
                  </div>
                  <div className="flex h-5 items-center">
                    <Skeleton className="h-3.5 w-2/3" />
                  </div>
                </div>
              </div>
            </div>
            <Separator />
            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex h-5 items-center gap-1.5">
                <Skeleton className="size-4 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
              </div>
              <div className="flex h-5 items-center gap-1.5">
                <Skeleton className="size-4 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
              </div>
              {canEdit ? <Skeleton className="ml-auto h-8 w-16" /> : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
