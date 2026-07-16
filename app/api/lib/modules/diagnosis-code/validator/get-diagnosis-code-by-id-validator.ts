import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  diagnosisCodeIdSchema,
  diagnosisCodeTenantIdSchema,
} from '../schemas/diagnosis-code-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export type GetDiagnosisCodeByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetDiagnosisCodeById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetDiagnosisCodeByIdInput> {
  const idResult = diagnosisCodeIdSchema.safeParse(id);
  const tenantIdResult = diagnosisCodeTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Diagnosis code ${String(id)} is Invalid.`);
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
