import { z } from 'zod';

export const medicationFormSchema = z
  .object({
    drugName: z
      .string()
      .trim()
      .min(1, 'Drug name is required')
      .max(200, 'Drug name must be at most 200 characters'),
    dose: z.string().max(100, 'Dose must be at most 100 characters'),
    route: z.string().max(50, 'Route must be at most 50 characters'),
    frequency: z.string().max(100, 'Frequency must be at most 100 characters'),
    status: z.enum(['active', 'stopped', 'completed']),
    startDate: z.string(),
    endDate: z.string(),
    notes: z.string().max(2000, 'Notes must be at most 2000 characters'),
  })
  .refine(
    (data) => data.startDate === '' || data.endDate === '' || data.endDate >= data.startDate,
    {
      message: 'End date must be on or after the start date',
      path: ['endDate'],
    }
  );

export type MedicationFormValues = z.infer<typeof medicationFormSchema>;

export const medicationFormDefaults: MedicationFormValues = {
  drugName: '',
  dose: '',
  route: '',
  frequency: '',
  status: 'active',
  startDate: '',
  endDate: '',
  notes: '',
};
