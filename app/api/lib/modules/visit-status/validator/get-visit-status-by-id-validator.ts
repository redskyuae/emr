import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitStatusIdSchema, visitStatusTenantIdSchema } from '../schemas/visit-status-schema';

export type GetVisitStatusByIdInput = { id: number; tenantId: string };

export function validateGetVisitStatusById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetVisitStatusByIdInput> {
  const idResult = visitStatusIdSchema.safeParse(id);
  const tenantIdResult = visitStatusTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Visit status ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
