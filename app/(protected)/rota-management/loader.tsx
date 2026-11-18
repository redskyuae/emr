import { ViewSkeleton } from '@/app/(protected)/rota-management/_components/doctor-rota-skeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function RotaManagementPageLoader() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading Doctor Rotas">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-full lg:max-w-sm" />
          <Skeleton className="h-10 w-full lg:ml-auto lg:w-44" />
        </CardContent>
      </Card>

      <ViewSkeleton layout="table" />
    </div>
  );
}
