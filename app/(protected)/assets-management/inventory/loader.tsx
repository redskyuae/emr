import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryLoader() {
  return (
    <div className="space-y-4" aria-label="Loading asset inventory">
      <Card className="shadow-fluent-2">
        <CardHeader className="gap-1.5 border-b">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="grid gap-2 sm:grid-cols-3 2xl:w-full 2xl:max-w-xl">
              <Skeleton className="h-9 w-full sm:col-span-2" />
              <Skeleton className="h-9 w-full sm:col-span-1" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center 2xl:ml-auto 2xl:justify-end">
              <Skeleton className="h-9 w-32" />
            </div>
          </div>

          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
