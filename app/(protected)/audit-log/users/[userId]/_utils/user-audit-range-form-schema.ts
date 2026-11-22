import { z } from 'zod';

export const userAuditRangeFormSchema = z
  .object({
    from: z.string().min(1, 'From date is required'),
    to: z.string().min(1, 'To date is required'),
  })
  .refine((values) => values.from <= values.to, {
    message: 'From date must be on or before To date',
    path: ['to'],
  });

export type UserAuditRangeFormValues = z.infer<typeof userAuditRangeFormSchema>;
