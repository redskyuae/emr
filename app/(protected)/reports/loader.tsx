import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// One entry per report card: how many period inputs it shows.
const REPORT_FIELD_COUNTS = [2, 1];

export default function ReportsPageLoader() {
  return (
    <div className="space-y-6" aria-label="Loading page">
      <Skeleton className="h-16 rounded-lg" />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {REPORT_FIELD_COUNTS.map((fields, index) => (
            <Card key={index}>
              <CardHeader className="space-y-1.5">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-36" />
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: fields }, (_, field) => (
                    <div key={field} className="space-y-2">
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-28" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
