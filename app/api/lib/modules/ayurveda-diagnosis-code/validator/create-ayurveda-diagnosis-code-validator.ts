import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createAyurvedaDiagnosisCodeSchema,
  type CreateAyurvedaDiagnosisCodeInput,
} from '../schemas/ayurveda-diagnosis-code-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { validateAyurvedaDiagnosisCodeUniqueness } from './ayurveda-diagnosis-code-uniqueness-validator';

export async function validateCreateAyurvedaDiagnosisCode(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateAyurvedaDiagnosisCodeInput>> {
  const result = createAyurvedaDiagnosisCodeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateAyurvedaDiagnosisCodeUniqueness({
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
