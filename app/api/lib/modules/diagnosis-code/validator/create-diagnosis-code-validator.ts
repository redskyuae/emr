import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createDiagnosisCodeSchema,
  type CreateDiagnosisCodeInput,
} from '../schemas/diagnosis-code-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { validateDiagnosisCodeUniqueness } from './diagnosis-code-uniqueness-validator';

export async function validateCreateDiagnosisCode(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateDiagnosisCodeInput>> {
  const result = createDiagnosisCodeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateDiagnosisCodeUniqueness({
    ...result.data,
    tenantId,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return { success: true, data: result.data };
}
