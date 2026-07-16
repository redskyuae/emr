import { z } from 'zod';

const ALLERGEN_CATEGORIES = ['drug', 'food', 'environmental', 'other'] as const;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const allergenNameSchema = z
  .string({ error: 'Allergen name is required' })
  .trim()
  .min(1, 'Allergen name cannot be empty')
  .max(150, 'Allergen name must be at most 150 characters');

const allergenCodeSchema = z
  .string({ error: 'Allergen code is required' })
  .trim()
  .min(1, 'Allergen code cannot be empty')
  .max(20, 'Allergen code must be at most 20 characters')
  .transform((code) => code.toUpperCase());

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
