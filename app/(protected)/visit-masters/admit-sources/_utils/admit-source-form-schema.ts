import { z } from 'zod';

// Client-side mirror of the create/update AdmitSource contract. Both operations
// require name and code, so both fields carry a required asterisk.
export const admitSourceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Admit source name is required.')
    .max(100, 'Admit source name must be at most 100 characters.')
    .regex(
      /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
      'Admit source name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    ),
  code: z
    .string()
    .trim()
    .min(1, 'Admit source code is required.')
    .max(10, 'Admit source code must be at most 10 characters.')
    .regex(
      /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
      'Admit source code must contain only letters, numbers, hyphens, and underscores.'
    )
    .transform((code) => code.toUpperCase()),
  description: z
    .string()
    .trim()
    .max(500, 'Admit source description must be at most 500 characters.')
    .transform((description) => (description === '' ? undefined : description))
    .optional(),
});

export type AdmitSourceFormValues = z.infer<typeof admitSourceFormSchema>;
