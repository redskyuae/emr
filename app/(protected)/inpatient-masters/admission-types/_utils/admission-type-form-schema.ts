import { z } from 'zod';

// Client-side mirror of the create/update AdmissionType contract. Both operations
// require name and code, so both fields carry a required asterisk.
export const admissionTypeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Admission type name is required.')
    .max(100, 'Admission type name must be at most 100 characters.')
    .regex(
      /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
      'Admission type name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    ),
  code: z
    .string()
    .trim()
    .min(1, 'Admission type code is required.')
    .max(10, 'Admission type code must be at most 10 characters.')
    .regex(
      /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
      'Admission type code must contain only letters, numbers, hyphens, and underscores.'
    )
    .transform((code) => code.toUpperCase()),
  description: z
    .string()
    .trim()
    .max(500, 'Admission type description must be at most 500 characters.')
    .transform((description) => (description === '' ? undefined : description))
    .optional(),
});

export type AdmissionTypeFormValues = z.infer<typeof admissionTypeFormSchema>;
