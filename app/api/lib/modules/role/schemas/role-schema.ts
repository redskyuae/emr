import { z } from 'zod';
import {
  nullableSimpleMasterDescriptionSchema,
  simpleMasterCodeSchema,
  simpleMasterDescriptionSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

const roleNameSchema = simpleMasterNameSchema({
  max: 100,
  fieldName: 'Role name',
  maxMessage: 'Role name must be at most 100 characters',
  emptyMessage: 'Role name cannot be empty',
  requiredMessage: 'Role name is required',
});

const roleCodeSchema = simpleMasterCodeSchema({
  max: 50,
  fieldName: 'Role code',
  maxMessage: 'Role code must be at most 50 characters',
  emptyMessage: 'Role code cannot be empty',
  requiredMessage: 'Role code is required',
});

const roleDescriptionSchema = simpleMasterDescriptionSchema({
  maxMessage: 'Role description must be at most 500 characters',
});

const nullableRoleDescriptionSchema = nullableSimpleMasterDescriptionSchema({
  maxMessage: 'Role description must be at most 500 characters',
});

export const roleIdSchema = z.coerce
  .number({ error: 'Role ID is required' })
  .int('Role ID must be an integer')
  .positive('Role ID must be positive');

export const roleTenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

export const createRoleSchema = z
  .object({
    name: roleNameSchema,
    code: roleCodeSchema,
    description: roleDescriptionSchema,
  })
  .strict();

export const updateRoleSchema = z
  .object({
    name: roleNameSchema.optional(),
    description: nullableRoleDescriptionSchema,
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one role field is required',
  });

export type RoleIdInput = z.infer<typeof roleIdSchema>;
export type RoleTenantIdInput = z.infer<typeof roleTenantIdSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export type Role = {
  id: number;
  code: string;
  name: string;
  isSystem: boolean;
  tenantId: string;
  createdOn: Date;
  modifiedOn: Date;
  description: string | null;
};

export type RoleWithStats = Role & {
  assignedStaffCount: number;
  permissionAssignmentCount: number;
};

export type RoleListParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: string;
};
