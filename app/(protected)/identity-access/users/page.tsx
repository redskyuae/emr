import { UsersPageImpl } from '@/app/(protected)/identity-access/users/_components/users-page-impl';
import {
  iamDirectoryDepartmentOptions,
  iamDirectoryRoleOptions,
  iamDirectoryUsers,
} from '@/app/(protected)/identity-access/dashboard/mock-data';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const inviteParam = params.invite;
  const initialInviteOpen = Array.isArray(inviteParam)
    ? inviteParam.includes('1')
    : inviteParam === '1';

  return (
    <UsersPageImpl
      users={iamDirectoryUsers}
      roleOptions={iamDirectoryRoleOptions}
      departmentOptions={iamDirectoryDepartmentOptions}
      initialInviteOpen={initialInviteOpen}
    />
  );
}
