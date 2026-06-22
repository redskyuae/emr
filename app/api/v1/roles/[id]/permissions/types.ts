import type { AssignedPermission } from '@/app/api/lib/modules/role-permission/schemas/role-permission-schema';

export type GetRolePermissionsResponse = {
  data: AssignedPermission[];
};

export type AssignRolePermissionsRequest = {
  permissionIds: number[];
};

export type AssignRolePermissionsResponse = {
  data: AssignedPermission[];
};

export type SetRolePermissionsRequest = {
  permissionIds: number[];
};

export type SetRolePermissionsResponse = {
  data: AssignedPermission[];
};
