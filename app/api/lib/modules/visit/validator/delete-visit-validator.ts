import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitIdSchema, visitTenantIdSchema } from '../schemas/visit-schema';

export type DeleteVisitInput = {
  id: number;
  tenantId: string;
};

export function validateDeleteVisit(
  id: unknown,
  tenantId: unknown
): ValidationResult<DeleteVisitInput> {
  const idResult = visitIdSchema.safeParse(id);
  const tenantIdResult = visitTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Visit ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: { id: idResult.data, tenantId: tenantIdResult.data },
  };
}
