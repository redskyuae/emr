import { z } from 'zod';

import type { Tenant } from '../../tenant/schemas/tenant-schema';

const emailSchema = z
  .string({ error: 'Email is required' })
  .trim()
  .min(1, 'Email is required')
  .email('Email must be valid')
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(1, 'Password is required')
  .max(128, 'Password must be at most 128 characters');

export const signinSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    rememberMe: z.boolean({ error: 'Remember me must be a boolean' }).optional().default(false),
  })
  .strict();

export type SigninInput = z.infer<typeof signinSchema>;

export type SigninResult = {
  tenant: Tenant;
  setCookies: string[];
};
