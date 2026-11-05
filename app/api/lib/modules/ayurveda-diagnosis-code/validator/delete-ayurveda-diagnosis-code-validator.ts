import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  ayurvedaDiagnosisCodeIdSchema,
  ayurvedaDiagnosisCodeTenantIdSchema,
} from '../schemas/ayurveda-diagnosis-code-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

type DeleteAyurvedaDiagnosisCodeInput = {
  id: number;
  tenantId: string;
};

export function validateDeleteAyurvedaDiagnosisCode(
  id: unknown,
  tenantId: unknown
): ValidationResult<DeleteAyurvedaDiagnosisCodeInput> {
  const idResult = ayurvedaDiagnosisCodeIdSchema.safeParse(id);
  const tenantIdResult = ayurvedaDiagnosisCodeTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Ayurveda diagnosis code ${String(id)} is Invalid.`);
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
