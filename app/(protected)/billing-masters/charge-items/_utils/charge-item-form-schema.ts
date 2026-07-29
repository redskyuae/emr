import { z } from 'zod';
import {
  simpleMasterCodeSchema,
  simpleMasterDescriptionSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

import { CHARGE_ITEM_CATEGORIES } from '@/app/db/schema/charge-item';

// Client-side mirror of the create/update Charge Item contract. Name, code,
// category and unit price are required; the API schema stays the server contract.
export const chargeItemFormSchema = z.object({
  name: simpleMasterNameSchema({
    max: 150,
    fieldName: 'Name',
    maxMessage: 'Name must be at most 150 characters.',
    emptyMessage: 'Name is required.',
  }),
  code: simpleMasterCodeSchema({
    max: 20,
    fieldName: 'Code',
    maxMessage: 'Code must be at most 20 characters.',
    emptyMessage: 'Code is required.',
  }),
  category: z.enum(CHARGE_ITEM_CATEGORIES, { error: 'Category is required.' }),
  unitPrice: z
    .string()
    .trim()
    .min(1, 'Unit price is required.')
    .refine((value) => !Number.isNaN(Number(value)), 'Unit price must be a number.')
    .refine((value) => Number(value) >= 0, 'Unit price must be zero or more.'),
  description: simpleMasterDescriptionSchema({
    maxMessage: 'Description must be at most 500 characters.',
  }),
  isActive: z.boolean(),
});

export type ChargeItemFormValues = z.infer<typeof chargeItemFormSchema>;
