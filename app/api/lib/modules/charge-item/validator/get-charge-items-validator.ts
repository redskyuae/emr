import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  chargeItemCategoryFilterSchema,
  chargeItemTenantIdSchema,
  type ChargeItemCategory,
} from '../schemas/charge-item-schema';

export type GetChargeItemsFilters = {
  tenantId: string;
  category?: ChargeItemCategory;
};

export function validateGetChargeItems(
  tenantId: unknown,
  category: unknown
): ValidationResult<GetChargeItemsFilters> {
  const tenantIdResult = chargeItemTenantIdSchema.safeParse(tenantId);
  const categoryResult = chargeItemCategoryFilterSchema.safeParse(
    category === '' || category === null ? undefined : category
  );

  if (!tenantIdResult.success || !categoryResult.success) {
    const errors: string[] = [];

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    if (!categoryResult.success) {
      errors.push(`Charge item category ${String(category)} is Invalid.`);
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      tenantId: tenantIdResult.data,
      category: categoryResult.data,
    },
  };
}
