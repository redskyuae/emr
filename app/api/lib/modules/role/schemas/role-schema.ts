import { z } from 'zod';

const roleNameSchema = z
  .string({ error: 'Role name is required' })
  .trim()
  .min(1, 'Role name cannot be empty')
  .max(100, 'Role name must be at most 100 characters');

const roleCodeSchema = z
  .string({ error: 'Role code is required' })
  .trim()
  .min(1, 'Role code cannot be empty')
  .max(50, 'Role code must be at most 50 characters')
  .transform((code) => code.toUpperCase());

const roleDescriptionSchema = z
  .string()
  .trim()
  .optional()
  .transform((description) => (description === '' ? undefined : description));

const nullableRoleDescriptionSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}, z.string().nullable().optional());

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
  tenantId: string;
  name: string;
  code: string;
  description: string | null;
  isSystem: boolean;
  createdOn: Date;
  modifiedOn: Date;
};

export type RoleWithStats = Role & {
  assignedStaffCount: number;
  permissionAssignmentCount: number;
};

export type RoleListParams = {
  tenantId: string;
  query?: string;
  page?: number;
  limit?: number;
};
