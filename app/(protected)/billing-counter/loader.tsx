import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// The counter page with its default "New invoice" tab: the demo-data banner, the entity and
// shift header with its four facts, the tab track, then the Patient & Visit and Charges cards
// beside the Payment panel.
export default function BillingCounterPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Billing Counter">
      <Skeleton className="h-[4.5rem] rounded-lg" aria-label="Loading demo data notice" />

      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-3 w-72 max-w-full" />
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-3 w-64" />
              <Skeleton className="h-8 w-36" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t pt-3 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, fact) => (
              <div key={fact} className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* The same column and gap as Tabs, so the tab body starts where it will land. */}
      <div className="flex flex-col gap-2">
        <Skeleton
          className="h-10 w-[44rem] max-w-full rounded-full"
          aria-label="Loading Billing Counter tabs"
        />

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Patient &amp; Visit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <FieldSkeleton />
                  <FieldSkeleton />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Charges</CardTitle>
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                {/* The Charge Item search, then the empty "No charges yet" note. */}
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-[4.5rem] w-full rounded-md" />
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-28" />
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }, (_, method) => (
                  <Skeleton key={method} className="h-8 w-20" />
                ))}
              </div>
              <div className="space-y-2 border-t pt-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
