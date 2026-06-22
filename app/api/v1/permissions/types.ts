import type { GroupedPermissions } from '@/app/api/lib/modules/permission/schemas/permission-schema';

export type ListPermissionsResponse = {
  data: GroupedPermissions;
};
