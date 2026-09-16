import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { treatmentIdSchema, treatmentTenantIdSchema } from '../schemas/treatment-schema';

export type DeleteTreatmentInput = {
  id: number;
  tenantId: string;
};

export function validateDeleteTreatment(
  id: unknown,
  tenantId: unknown
): ValidationResult<DeleteTreatmentInput> {
  const idResult = treatmentIdSchema.safeParse(id);
  const tenantIdResult = treatmentTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Treatment ${String(id)} is Invalid.`);
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
