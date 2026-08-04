import { z } from 'zod';

const roleNameSchema = z
  .string({ error: 'Role name is required' })
  .trim()
  .min(1, 'Role name cannot be empty')
  .max(100, 'Role name must be at most 100 characters')
  .regex(
    /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
    'Role name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
  );

const roleCodeSchema = z
  .string({ error: 'Role code is required' })
  .trim()
  .min(1, 'Role code cannot be empty')
  .max(50, 'Role code must be at most 50 characters')
  .regex(
    /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
    'Role code must contain only letters, numbers, hyphens, and underscores.'
  )
  .transform((code) => code.toUpperCase());

const roleDescriptionSchema = z
  .string()
  .trim()
  .max(500, 'Role description must be at most 500 characters')
  .transform((description) => (description === '' ? undefined : description))
  .optional();

const nullableRoleDescriptionSchema = z
  .union([z.string().trim().max(500, 'Role description must be at most 500 characters'), z.null()])
  .transform((description) => (description === '' ? null : description))
  .optional();

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
