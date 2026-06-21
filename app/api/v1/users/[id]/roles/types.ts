import type { AssignedRole } from '@/app/api/lib/modules/user-role/schemas/user-role-schema';

export type GetUserRolesResponse = {
  data: AssignedRole[];
};

export type AssignUserRolesRequest = {
  roleIds: number[];
};

export type AssignUserRolesResponse = {
  data: AssignedRole[];
};
