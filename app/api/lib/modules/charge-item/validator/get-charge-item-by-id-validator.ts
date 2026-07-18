import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { chargeItemIdSchema, chargeItemTenantIdSchema } from '../schemas/charge-item-schema';

export type GetChargeItemByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetChargeItemById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetChargeItemByIdInput> {
  const idResult = chargeItemIdSchema.safeParse(id);
  const tenantIdResult = chargeItemTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Charge item ${String(id)} is Invalid.`);
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
