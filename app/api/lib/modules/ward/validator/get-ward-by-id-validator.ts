import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { wardIdSchema, wardTenantIdSchema } from '../schemas/ward-schema';

export type GetWardByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetWardById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetWardByIdInput> {
  const idResult = wardIdSchema.safeParse(id);
  const tenantIdResult = wardTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Ward ${String(id)} is Invalid.`);
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
