import { AssetDirectoryTableSkeleton } from '@/app/(protected)/assets-management/inventory/_components/asset-directory-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryLoader() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading asset inventory">
      <Card>
        <CardHeader className="border-b">
          <div>
            <CardTitle>Asset directory</CardTitle>
            <CardDescription>Tracked Assets across Facilities and departments.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="grid gap-2 sm:grid-cols-3 2xl:w-full 2xl:max-w-xl">
              <Skeleton className="h-10 w-full sm:col-span-2" />
              <Skeleton className="h-10 w-full sm:col-span-1" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center 2xl:ml-auto 2xl:justify-end">
              <Skeleton className="h-9 w-full sm:w-32" />
            </div>
          </div>

          <AssetDirectoryTableSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}
