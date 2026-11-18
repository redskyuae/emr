import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function CaptureListCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="space-y-1.5 rounded-md border p-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function AdmissionDetailPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-80 max-w-full" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 2 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-9 w-32" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-80 max-w-full" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CaptureListCardSkeleton />
        <CaptureListCardSkeleton />
      </div>
    </div>
  );
}
