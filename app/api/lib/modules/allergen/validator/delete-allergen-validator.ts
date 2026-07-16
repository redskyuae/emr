import type { ValidationResult } from '@/app/api/lib/utils/types';
import { allergenIdSchema, allergenTenantIdSchema } from '../schemas/allergen-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export type DeleteAllergenInput = {
  id: number;
  tenantId: string;
};

export function validateDeleteAllergen(
  id: unknown,
  tenantId: unknown
): ValidationResult<DeleteAllergenInput> {
  const idResult = allergenIdSchema.safeParse(id);
  const tenantIdResult = allergenTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Allergen ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
    },
  };
}
