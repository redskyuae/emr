import { z } from 'zod';

/** Select value meaning "no filter" — Radix Select cannot hold an empty string. */
export const ALL_OPTIONS = 'all';

export const auditLogFilterFormSchema = z
  .object({
    // Blank dates mean no bound on that side.
    from: z.string(),
    to: z.string(),
    module: z.string(),
    operation: z.string(),
    query: z.string().trim().max(100, 'Search must be at most 100 characters'),
  })
  .refine((values) => !values.from || !values.to || values.from <= values.to, {
    message: 'From date must be on or before To date',
    path: ['to'],
  });

export type AuditLogFilterFormValues = z.infer<typeof auditLogFilterFormSchema>;
