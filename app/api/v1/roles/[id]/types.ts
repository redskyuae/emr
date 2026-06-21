import type { Role } from '@/app/api/lib/modules/role/schemas/role-schema';

export type GetRoleResponse = {
  data: Role;
};

export type UpdateRoleRequest = {
  name?: string;
  description?: string | null;
};

export type UpdateRoleResponse = {
  data: Role;
};

export type DeleteRoleResponse = void;
