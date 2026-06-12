import { z } from 'zod';

import { permissionIdSchema } from '../../permission/schemas/permission-schema';

export const rolePermissionIdsSchema = z
  .object({
    permissionIds: z.array(permissionIdSchema, {
      error: 'Permission IDs are required',
    }),
  })
  .strict();

export const assignRolePermissionsSchema = rolePermissionIdsSchema.refine(
  (payload) => payload.permissionIds.length > 0,
  {
    message: 'At least one Permission ID is required',
    path: ['permissionIds'],
  }
);

export const setRolePermissionsSchema = rolePermissionIdsSchema;

export type RolePermissionIdsInput = z.infer<typeof rolePermissionIdsSchema>;
export type AssignRolePermissionsInput = z.infer<typeof assignRolePermissionsSchema>;
export type SetRolePermissionsInput = z.infer<typeof setRolePermissionsSchema>;

export type AssignedPermission = {
  id: number;
  module: string;
  resource: string;
  action: string;
  name: string;
  description: string | null;
};

export type PermissionAssignment = {
  id: number;
  roleId: number;
  permissionId: number;
  tenantId: string;
  createdOn: Date;
};
