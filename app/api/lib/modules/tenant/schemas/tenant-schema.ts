import { z } from 'zod';

export const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID is required');

const tenantNameSchema = z
  .string({ error: 'Tenant name is required' })
  .trim()
  .min(1, 'Tenant name cannot be empty')
  .max(100, 'Tenant name must be at most 100 characters');

const tenantLogoSchema = z
  .string({ error: 'Tenant logo must be a valid URL' })
  .trim()
  .url('Tenant logo must be a valid URL')
  .max(2048, 'Tenant logo must be at most 2048 characters');

export const tenantSlugSchema = z
  .string({ error: 'Tenant slug is required' })
  .min(1, 'Tenant slug is required')
  .max(60, 'Tenant slug must be at most 60 characters')
  .regex(/^[a-z0-9-]+$/, 'Tenant slug must contain only lowercase letters, numbers, and hyphens');

export const createTenantSchema = z.object({
  name: tenantNameSchema,
  logo: tenantLogoSchema.optional(),
});

export const updateTenantSchema = z
  .object({
    name: tenantNameSchema.optional(),
    logo: tenantLogoSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.logo !== undefined, {
    message: 'At least one tenant field is required',
  });

export function createTenantSlug(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

export type TenantIdInput = z.infer<typeof tenantIdSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

export type ValidatedCreateTenantInput = CreateTenantInput & {
  slug: string;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  isActive: boolean;
  logo: string | null;
  isOnboarded: boolean;
};

export type TenantMembership = {
  id: string;
  role: string;
  userId: string;
  tenantId: string;
};
