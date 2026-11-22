import { z } from 'zod';

export const userAuditFilterFormSchema = z
  .object({
    from: z.string().min(1, 'From date is required'),
    to: z.string().min(1, 'To date is required'),
    query: z.string().trim().max(100, 'Search must be at most 100 characters'),
  })
  .refine((values) => !values.from || !values.to || values.from <= values.to, {
    message: 'From date must be on or before To date',
    path: ['to'],
  });

export type UserAuditFilterFormValues = z.infer<typeof userAuditFilterFormSchema>;
