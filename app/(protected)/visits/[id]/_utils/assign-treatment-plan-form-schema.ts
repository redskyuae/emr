import { z } from 'zod';

export const assignTreatmentPlanFormSchema = z.object({
  treatmentId: z.string().min(1, 'Treatment is required.'),
  totalSessions: z
    .string()
    .refine(
      (value) =>
        value === '' || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 100),
      'Number of Sessions must be between 1 and 100.'
    ),
  additionalSessions: z
    .string()
    .refine(
      (value) => /^\d+$/.test(value) && Number(value) >= 0 && Number(value) <= 100,
      'Additional Sessions must be between 0 and 100.'
    ),
});

export type AssignTreatmentPlanFormValues = z.infer<typeof assignTreatmentPlanFormSchema>;
