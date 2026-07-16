import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitTypeIdSchema, visitTypeTenantIdSchema } from '../schemas/visit-type-schema';

export type DeleteVisitTypeInput = {
  id: number;
  tenantId: string;
};

export function validateDeleteVisitType(
  id: unknown,
  tenantId: unknown
): ValidationResult<DeleteVisitTypeInput> {
  const idResult = visitTypeIdSchema.safeParse(id);
  const tenantIdResult = visitTypeTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Visit type ${String(id)} is Invalid.`);
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
