import { PatientsTableSkeleton } from '@/app/(protected)/patients/_components/patients-table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PatientsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Patients">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-full lg:max-w-sm" />
          <Skeleton className="h-10 w-full lg:w-40" />
          <Skeleton className="h-10 w-full lg:w-40" />
          <Skeleton className="h-10 w-full lg:ml-auto lg:w-40" />
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-0">
          <PatientsTableSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}
