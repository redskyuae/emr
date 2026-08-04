import { z } from 'zod';

export const cancelledReasonFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Appointment cancelled reason name cannot be empty')
    .max(100, 'Appointment cancelled reason name must be at most 100 characters')
    .regex(
      /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
      'Appointment cancelled reason name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    ),
  code: z
    .string()
    .trim()
    .min(1, 'Appointment cancelled reason code cannot be empty')
    .max(10, 'Appointment cancelled reason code must be at most 10 characters')
    .regex(
      /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
      'Appointment cancelled reason code must contain only letters, numbers, hyphens, and underscores.'
    )
    .transform((code) => code.toUpperCase()),
  description: z
    .string()
    .trim()
    .max(500, 'Appointment cancelled reason description must be at most 500 characters')
    .transform((description) => (description === '' ? undefined : description))
    .optional(),
});

export type CancelledReasonFormValues = z.infer<typeof cancelledReasonFormSchema>;
