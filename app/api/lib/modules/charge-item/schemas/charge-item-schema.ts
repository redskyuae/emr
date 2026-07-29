import { z } from 'zod';
import {
  nullableToOptionalSimpleMasterDescriptionSchema,
  simpleMasterCodeSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

import { CHARGE_ITEM_CATEGORIES } from '@/app/db/schema/charge-item';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const chargeItemNameSchema = simpleMasterNameSchema({
  max: 150,
  fieldName: 'Charge item name',
  maxMessage: 'Charge item name must be at most 150 characters',
  emptyMessage: 'Charge item name cannot be empty',
  requiredMessage: 'Charge item name is required',
});

const chargeItemCodeSchema = simpleMasterCodeSchema({
  max: 20,
  fieldName: 'Charge item code',
  maxMessage: 'Charge item code must be at most 20 characters',
  emptyMessage: 'Charge item code cannot be empty',
  requiredMessage: 'Charge item code is required',
});

const chargeItemCategorySchema = z.enum(CHARGE_ITEM_CATEGORIES, {
  error: `Charge item category must be one of ${CHARGE_ITEM_CATEGORIES.join(', ')}`,
});

// A blank string coerces to 0 via plain Number('') === 0, which would let a
// required price silently pass validation as free — treat blank/null the same
// as absent so the "is required" error fires instead of a $0 Charge Item.
const chargeItemUnitPriceSchema = z.preprocess(
  (value) =>
    value === null || (typeof value === 'string' && value.trim() === '') ? undefined : value,
  z.coerce
    .number({ error: 'Charge item unit price is required' })
    .nonnegative('Charge item unit price must be zero or more')
    .max(9_999_999_999, 'Charge item unit price is too large')
    .transform((value) => Math.round(value * 100) / 100)
);

const chargeItemDescriptionSchema = nullableToOptionalSimpleMasterDescriptionSchema({
  maxMessage: 'Charge item description must be at most 500 characters',
});

const chargeItemIsActiveSchema = z.boolean().optional().default(true);

export const chargeItemIdSchema = z.coerce
  .number({ error: 'Charge item ID is required' })
  .int('Charge item ID must be an integer')
  .positive('Charge item ID must be positive');

export const chargeItemTenantIdSchema = tenantIdSchema;

export const chargeItemCategoryFilterSchema = chargeItemCategorySchema.optional();

export const createChargeItemSchema = z.object({
  name: chargeItemNameSchema,
  code: chargeItemCodeSchema,
  category: chargeItemCategorySchema,
  unitPrice: chargeItemUnitPriceSchema,
  description: chargeItemDescriptionSchema,
  isActive: chargeItemIsActiveSchema,
});

// Unlike create, isActive has no default here: omitting it on update means
// "leave the current Active state as-is," not "reactivate." Defaulting it to
// true (as create does) would silently reactivate a deliberately-retired
// Charge Item for any client that only means to edit name/code/price.
// The validator fills the omitted value from the existing row.
export const updateChargeItemSchema = createChargeItemSchema.extend({
  isActive: z.boolean().optional(),
});

export type ChargeItemCategory = (typeof CHARGE_ITEM_CATEGORIES)[number];
export type ChargeItemIdInput = z.infer<typeof chargeItemIdSchema>;
export type ChargeItemTenantIdInput = z.infer<typeof chargeItemTenantIdSchema>;
export type CreateChargeItemInput = z.infer<typeof createChargeItemSchema>;
export type UpdateChargeItemInput = z.infer<typeof updateChargeItemSchema>;
export type CreateChargeItemData = CreateChargeItemInput & { tenantId: string };
export type UpdateChargeItemData = UpdateChargeItemInput & { tenantId: string };

export type ChargeItem = {
  id: number;
  name: string;
  code: string;
  tenantId: string;
  isActive: boolean;
  unitPrice: number;
  createdOn: Date;
  modifiedOn: Date;
  description: string | null;
  category: ChargeItemCategory;
};

export type ChargeItemListParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: string;
  isActive?: boolean;
  category?: ChargeItemCategory;
};
