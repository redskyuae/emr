import { z } from 'zod';

export const reasonFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Appointment reason name cannot be empty')
    .max(100, 'Appointment reason name must be at most 100 characters'),
  code: z
    .string()
    .trim()
    .min(1, 'Appointment reason code cannot be empty')
    .max(10, 'Appointment reason code must be at most 10 characters'),
  description: z.string().trim().optional(),
});

export type ReasonFormValues = z.infer<typeof reasonFormSchema>;
