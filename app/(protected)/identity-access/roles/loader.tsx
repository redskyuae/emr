import { RoleGridSkeleton } from '@/app/(protected)/identity-access/roles/_components/role-grid-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function RolesPageLoader() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading Roles">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex h-5 items-center">
          <Skeleton className="h-3.5 w-60 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <RoleGridSkeleton />
    </div>
  );
}
