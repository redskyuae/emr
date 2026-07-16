import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  listVisitsSchema,
  visitTenantIdSchema,
  type VisitListParams,
} from '../schemas/visit-schema';

export function validateGetVisits(
  filters: unknown,
  tenantId: unknown
): ValidationResult<VisitListParams> {
  const tenantIdResult = visitTenantIdSchema.safeParse(tenantId);
  const filtersResult = listVisitsSchema.safeParse(filters ?? {});

  if (!tenantIdResult.success || !filtersResult.success) {
    const errors: string[] = [];

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    if (!filtersResult.success) {
      errors.push(...formatValidationErrors(filtersResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: { ...filtersResult.data, tenantId: tenantIdResult.data },
  };
}
