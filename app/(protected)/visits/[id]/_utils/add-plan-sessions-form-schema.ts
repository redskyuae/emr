import { z } from 'zod';

// Mirrors the API contract: 1–100 Sessions per request.
export const addPlanSessionsFormSchema = z.object({
  sessions: z
    .string()
    .trim()
    .min(1, 'Sessions is required')
    .regex(/^\d+$/, 'Sessions must be a positive integer')
    .transform(Number)
    .pipe(
      z
        .number()
        .int('Sessions must be a positive integer')
        .positive('Sessions must be a positive integer')
        .max(100, 'Sessions must be at most 100')
    ),
});

export type AddPlanSessionsFormInput = z.input<typeof addPlanSessionsFormSchema>;
export type AddPlanSessionsFormValues = z.output<typeof addPlanSessionsFormSchema>;
