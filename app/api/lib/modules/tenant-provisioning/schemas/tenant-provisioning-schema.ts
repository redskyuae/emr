import { z } from 'zod';

import type { Tenant } from '../../tenant/schemas/tenant-schema';

const tenantNameSchema = z
  .string({ error: 'Tenant name is required' })
  .trim()
  .min(1, 'Tenant name cannot be empty')
  .max(100, 'Tenant name must be at most 100 characters');

const ownerNameSchema = z
  .string({ error: 'Owner name is required' })
  .trim()
  .min(1, 'Owner name cannot be empty')
  .max(100, 'Owner name must be at most 100 characters');

const ownerEmailSchema = z
  .string({ error: 'Owner email is required' })
  .trim()
  .min(1, 'Owner email is required')
  .email('Owner email must be valid')
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

export const signupSchema = z
  .object({
    password: passwordSchema,
    ownerName: ownerNameSchema,
    tenantName: tenantNameSchema,
    ownerEmail: ownerEmailSchema,
  })
  .strict();

export type SignupInput = z.infer<typeof signupSchema>;

export type ValidatedTenantProvisioningInput = SignupInput & {
  tenantSlug: string;
};

export type TenantProvisioningResult = {
  tenant: Tenant;
  setCookies: string[];
};
