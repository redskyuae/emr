import { z } from 'zod';
import {
  simpleMasterCodeSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

const ALLERGEN_CATEGORIES = ['drug', 'food', 'environmental', 'other'] as const;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const allergenNameSchema = simpleMasterNameSchema({
  max: 150,
  fieldName: 'Allergen name',
  maxMessage: 'Allergen name must be at most 150 characters',
  emptyMessage: 'Allergen name cannot be empty',
  requiredMessage: 'Allergen name is required',
});

const allergenCodeSchema = simpleMasterCodeSchema({
  max: 20,
  fieldName: 'Allergen code',
  maxMessage: 'Allergen code must be at most 20 characters',
  emptyMessage: 'Allergen code cannot be empty',
  requiredMessage: 'Allergen code is required',
});

const allergenCategorySchema = z.enum(ALLERGEN_CATEGORIES, {
  error: 'Allergen category is invalid',
});

export const allergenIdSchema = z.coerce
  .number({ error: 'Allergen ID is required' })
  .int('Allergen ID must be an integer')
  .positive('Allergen ID must be positive');

export const allergenTenantIdSchema = tenantIdSchema;

export const createAllergenSchema = z.object({
  name: allergenNameSchema,
  code: allergenCodeSchema,
  category: allergenCategorySchema,
});

export const updateAllergenSchema = createAllergenSchema;

export type AllergenCategory = (typeof ALLERGEN_CATEGORIES)[number];
export type AllergenIdInput = z.infer<typeof allergenIdSchema>;
export type AllergenTenantIdInput = z.infer<typeof allergenTenantIdSchema>;
export type CreateAllergenInput = z.infer<typeof createAllergenSchema>;
export type UpdateAllergenInput = z.infer<typeof updateAllergenSchema>;
export type CreateAllergenData = CreateAllergenInput & { tenantId: string };
export type UpdateAllergenData = UpdateAllergenInput & { tenantId: string };

export type Allergen = {
  id: number;
  code: string;
  name: string;
  tenantId: string;
  createdOn: Date;
  modifiedOn: Date;
  category: AllergenCategory;
};

export type AllergenListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
