import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  visitStatusCountsSchema,
  visitTenantIdSchema,
  type VisitStatusCountsParams,
} from '../schemas/visit-schema';

export function validateGetVisitStatusCounts(
  filters: unknown,
  tenantId: unknown
): ValidationResult<VisitStatusCountsParams> {
  const tenantIdResult = visitTenantIdSchema.safeParse(tenantId);
  const filtersResult = visitStatusCountsSchema.safeParse(filters ?? {});

  if (!tenantIdResult.success || !filtersResult.success) {
    return {
      success: false,
      errors: [
        ...(tenantIdResult.success ? [] : formatValidationErrors(tenantIdResult.error)),
        ...(filtersResult.success ? [] : formatValidationErrors(filtersResult.error)),
      ],
    };
  }

  return { success: true, data: { ...filtersResult.data, tenantId: tenantIdResult.data } };
}
