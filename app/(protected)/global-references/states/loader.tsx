import { ViewSkeleton } from '@/app/(protected)/global-references/states/_components/state-skeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatesPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading States">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-10 w-full lg:max-w-sm" />
          <Skeleton className="h-10 w-full lg:w-52" />
          <Skeleton className="h-10 w-full sm:ml-auto sm:w-32" />
        </CardContent>
      </Card>

      <ViewSkeleton layout="table" canEdit canDelete />
    </div>
  );
}
