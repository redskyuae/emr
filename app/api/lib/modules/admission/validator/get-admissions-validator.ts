import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  admissionTenantIdSchema,
  listAdmissionsSchema,
  type AdmissionListParams,
} from '../schemas/admission-schema';

export function validateGetAdmissions(
  params: unknown,
  tenantId: unknown
): ValidationResult<AdmissionListParams> {
  const tenantIdResult = admissionTenantIdSchema.safeParse(tenantId);
  const paramsResult = listAdmissionsSchema.safeParse(params ?? {});

  if (!tenantIdResult.success || !paramsResult.success) {
    const errors: string[] = [];

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    if (!paramsResult.success) {
      errors.push(...formatValidationErrors(paramsResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: { ...paramsResult.data, tenantId: tenantIdResult.data },
  };
}
