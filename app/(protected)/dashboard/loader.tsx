import { StatCardSkeleton } from '@/components/app/stat-card';
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Appointment Dashboard" aria-busy="true">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex h-7 items-center">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex h-5 items-center">
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <Skeleton className="hidden h-9 w-44 sm:block" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <StatCardSkeleton key={item} hint />
        ))}
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-3">
        <Card className="shadow-fluent-2 xl:col-span-2">
          <CardHeader>
            <div className="flex h-5.5 items-center">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex h-5 items-center">
              <Skeleton className="h-3 w-52 max-w-full" />
            </div>
            <CardAction>
              <Skeleton className="h-8 w-24" />
            </CardAction>
          </CardHeader>
          <CardContent className="divide-border divide-y">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="py-3">
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-fluent-2">
          <CardHeader>
            <div className="flex h-5.5 items-center">
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="flex h-5 items-center">
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((item) => (
                <div key={item} className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-10" />
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t pt-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
