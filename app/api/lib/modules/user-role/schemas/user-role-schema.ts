import { z } from 'zod';

import { roleIdSchema, type Role } from '../../role/schemas/role-schema';

export const assignUserRolesSchema = z
  .object({
    roleIds: z.array(roleIdSchema, {
      error: 'Role IDs are required',
    }),
  })
  .strict()
  .refine((payload) => payload.roleIds.length > 0, {
    message: 'At least one Role ID is required',
    path: ['roleIds'],
  });

export type AssignUserRolesInput = z.infer<typeof assignUserRolesSchema>;
export type AssignedRole = Role;

export type RoleAssignment = {
  id: number;
  userId: string;
  roleId: number;
  tenantId: string;
  assignedBy: string;
  assignedOn: Date;
  createdOn: Date;
};
