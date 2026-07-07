import { z } from 'zod';

export const cancelledReasonFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Appointment cancelled reason name cannot be empty')
    .max(100, 'Appointment cancelled reason name must be at most 100 characters'),
  code: z
    .string()
    .trim()
    .min(1, 'Appointment cancelled reason code cannot be empty')
    .max(10, 'Appointment cancelled reason code must be at most 10 characters'),
  description: z.string().trim().optional(),
});

export type CancelledReasonFormValues = z.infer<typeof cancelledReasonFormSchema>;
