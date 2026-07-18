import { z } from 'zod';

import { CHARGE_ITEM_CATEGORIES } from '@/app/db/schema/charge-item';

// Client-side mirror of the create/update Charge Item contract. Name, code,
// category and unit price are required; the API schema stays the server contract.
export const chargeItemFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(150, 'Name must be at most 150 characters.'),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required.')
    .max(20, 'Code must be at most 20 characters.'),
  category: z.enum(CHARGE_ITEM_CATEGORIES, { error: 'Category is required.' }),
  unitPrice: z
    .string()
    .trim()
    .min(1, 'Unit price is required.')
    .refine((value) => !Number.isNaN(Number(value)), 'Unit price must be a number.')
    .refine((value) => Number(value) >= 0, 'Unit price must be zero or more.'),
  description: z.string().trim(),
  isActive: z.boolean(),
});

export type ChargeItemFormValues = z.infer<typeof chargeItemFormSchema>;
