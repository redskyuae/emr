import { z } from 'zod';

const positiveIntegerString = (requiredMessage: string, integerMessage: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .regex(/^\d+$/, integerMessage)
    .transform(Number)
    .pipe(z.number().int(integerMessage).positive(integerMessage));

export const addTreatmentPlanSessionsFormSchema = z.object({
  patientTreatmentPlanId: positiveIntegerString(
    'Treatment Plan is required',
    'Treatment Plan is invalid'
  ),
  sessions: positiveIntegerString('Sessions is required', 'Sessions must be a positive integer'),
});

export type AddTreatmentPlanSessionsFormInput = z.input<typeof addTreatmentPlanSessionsFormSchema>;
export type AddTreatmentPlanSessionsFormValues = z.output<
  typeof addTreatmentPlanSessionsFormSchema
>;
