import { z } from 'zod';

export const addLineFormSchema = z.object({
  chargeItemId: z.string().min(1, 'Charge item is required.'),
  quantity: z
    .string()
    .min(1, 'Quantity is required.')
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
      'Quantity must be a whole number of at least 1.'
    ),
  unitPrice: z
    .string()
    .refine(
      (value) => value === '' || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      'Unit price must be zero or more.'
    ),
});

export type AddLineFormValues = z.infer<typeof addLineFormSchema>;
