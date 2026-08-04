import { z } from 'zod';

export const roleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Role name is required.')
    .max(100, 'Role name must be at most 100 characters.')
    .regex(
      /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
      'Role name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    ),
  code: z
    .string()
    .trim()
    .min(1, 'Role code is required.')
    .max(50, 'Role code must be at most 50 characters.')
    .regex(
      /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
      'Role code must contain only letters, numbers, hyphens, and underscores.'
    )
    .transform((code) => code.toUpperCase()),
  description: z
    .string()
    .trim()
    .max(500, 'Role description must be at most 500 characters.')
    .transform((description) => (description === '' ? undefined : description))
    .optional(),
  permissionIds: z.array(z.number()),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
