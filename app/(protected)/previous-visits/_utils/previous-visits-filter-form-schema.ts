import { z } from 'zod';

export const previousVisitsFilterFormSchema = z
  .object({
    to: z.string().min(1, 'To date is required'),
    // Blank means no lower bound: every Visit up to the To date.
    from: z.string(),
    query: z.string().trim().max(100, 'Search must be at most 100 characters'),
    // `null` means no filter on that field.
    status: z.string().nullable(),
    doctorId: z.string().nullable(),
    visitTypeId: z.string().nullable(),
  })
  .refine((values) => !values.from || !values.to || values.from <= values.to, {
    message: 'From date must be on or before To date',
    path: ['to'],
  });

export type PreviousVisitsFilterFormValues = z.infer<typeof previousVisitsFilterFormSchema>;
