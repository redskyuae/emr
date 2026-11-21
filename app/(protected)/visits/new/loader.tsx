import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function SectionHeadingSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 shrink-0 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-64 max-w-full" />
      </div>
    </div>
  );
}

export default function CreateVisitLoader() {
  return (
    <div className="space-y-4 pb-28" aria-label="Loading Create Visit options">
      <div className="bg-card flex flex-wrap items-center justify-between gap-4 rounded-xl border px-5 py-4">
        <div className="space-y-1">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="hidden h-px w-8 sm:block" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeadingSkeleton />
            <Skeleton className="h-10 w-full rounded-full sm:w-80" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
              <div className="space-y-1 rounded-lg border p-1">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex items-center gap-3 px-3 py-2">
                    <Skeleton className="size-4 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-56 max-w-full" />
                      <Skeleton className="h-3 w-72 max-w-full" />
                    </div>
                    <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-40 w-full rounded-xl" />
          </CardContent>
        </Card>

        <Card aria-label="Loading Patient Treatment Plans">
          <CardHeader className="border-b">
            <SectionHeadingSkeleton />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      <Card className="fixed right-4 bottom-4 left-4 z-20 py-3 lg:left-[calc(var(--sidebar-width)+1rem)]">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 px-3">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-40 rounded-full" />
          </div>
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-9 w-36" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
