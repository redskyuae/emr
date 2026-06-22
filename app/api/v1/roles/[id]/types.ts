import type { RoleWithStats } from '@/app/api/lib/modules/role/schemas/role-schema';

export type GetRoleResponse = {
  data: RoleWithStats;
};

export type UpdateRoleRequest = {
  name?: string;
  description?: string | null;
};

export type UpdateRoleResponse = {
  data: RoleWithStats;
};

export type DeleteRoleResponse = void;
