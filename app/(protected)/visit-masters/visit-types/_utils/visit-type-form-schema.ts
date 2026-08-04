import { z } from 'zod';

// Client-side mirror of the create/update VisitType contract. Both operations
// require name and code, so both fields carry a required asterisk.
export const visitTypeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Visit type name is required.')
    .max(100, 'Visit type name must be at most 100 characters.')
    .regex(
      /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
      'Visit type name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    ),
  code: z
    .string()
    .trim()
    .min(1, 'Visit type code is required.')
    .max(10, 'Visit type code must be at most 10 characters.')
    .regex(
      /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
      'Visit type code must contain only letters, numbers, hyphens, and underscores.'
    )
    .transform((code) => code.toUpperCase()),
  description: z
    .string()
    .trim()
    .max(500, 'Visit type description must be at most 500 characters.')
    .transform((description) => (description === '' ? undefined : description))
    .optional(),
});

export type VisitTypeFormValues = z.infer<typeof visitTypeFormSchema>;
