import { UsersTableSkeleton } from '@/app/(protected)/identity-access/users/_components/users-table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function UsersPageLoader() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading Staff">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-full lg:max-w-sm" />
          <Skeleton className="h-10 w-full lg:w-48" />
          <Skeleton className="h-10 w-full lg:w-40" />
          <Skeleton className="h-9 w-full lg:ml-auto lg:w-28" />
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-0">
          <UsersTableSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}
