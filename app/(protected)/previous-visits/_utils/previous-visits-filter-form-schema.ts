import { z } from 'zod';

/** Select value meaning "no filter" — Radix Select cannot hold an empty string. */
export const ALL_FILTER = 'all';

export const previousVisitsFilterFormSchema = z
  .object({
    to: z.string().min(1, 'To date is required'),
    // Blank means no lower bound: every Visit up to the To date.
    from: z.string(),
    query: z.string().trim().max(100, 'Search must be at most 100 characters'),
    status: z.string(),
    doctorId: z.string(),
    visitTypeId: z.string(),
  })
  .refine((values) => !values.from || !values.to || values.from <= values.to, {
    message: 'From date must be on or before To date',
    path: ['to'],
  });

export type PreviousVisitsFilterFormValues = z.infer<typeof previousVisitsFilterFormSchema>;
