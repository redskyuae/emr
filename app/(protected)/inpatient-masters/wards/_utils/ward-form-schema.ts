import { z } from 'zod';

// Client-side mirror of the create/update Ward contract. Both operations
// require name and code, so both fields carry a required asterisk.
export const wardFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ward name is required.')
    .max(100, 'Ward name must be at most 100 characters.')
    .regex(
      /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
      'Ward name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    ),
  code: z
    .string()
    .trim()
    .min(1, 'Ward code is required.')
    .max(10, 'Ward code must be at most 10 characters.')
    .regex(
      /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
      'Ward code must contain only letters, numbers, hyphens, and underscores.'
    )
    .transform((code) => code.toUpperCase()),
  description: z
    .string()
    .trim()
    .max(500, 'Ward description must be at most 500 characters.')
    .transform((description) => (description === '' ? undefined : description))
    .optional(),
});

export type WardFormValues = z.infer<typeof wardFormSchema>;
