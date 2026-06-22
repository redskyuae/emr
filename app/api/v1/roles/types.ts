import type { RoleWithStats } from '@/app/api/lib/modules/role/schemas/role-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListRolesResponse = Paginated<RoleWithStats>;

export type SaveRoleRequest = {
  name: string;
  code: string;
  description?: string;
};

export type SaveRoleResponse = {
  data: RoleWithStats;
};
