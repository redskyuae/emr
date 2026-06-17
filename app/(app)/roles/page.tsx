import { RolesPageClient } from '@/app/(app)/roles/roles-page-client';
import {
  iamDirectoryUsers,
  iamPermissionSections,
  iamRoles,
} from '@/app/(app)/iam-dashboard/mock-data';

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const createParam = params.create;
  const initialCreateOpen = Array.isArray(createParam)
    ? createParam.includes('1')
    : createParam === '1';

  return (
    <RolesPageClient
      key={initialCreateOpen ? 'create-role-open' : 'roles-list'}
      roles={iamRoles}
      permissionSections={iamPermissionSections}
      staffUsers={iamDirectoryUsers}
      initialCreateOpen={initialCreateOpen}
    />
  );
}
