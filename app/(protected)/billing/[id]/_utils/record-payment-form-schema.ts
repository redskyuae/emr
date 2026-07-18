import { z } from 'zod';

import { PAYMENT_METHODS } from '@/app/db/schema/payment';

export const recordPaymentFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) > 0,
      'Amount must be greater than zero.'
    ),
  method: z.enum(PAYMENT_METHODS, { error: 'Method is required.' }),
  reference: z.string().trim().max(100, 'Reference must be at most 100 characters.'),
  notes: z.string().trim().max(255, 'Notes must be at most 255 characters.'),
});

export type RecordPaymentFormValues = z.infer<typeof recordPaymentFormSchema>;
