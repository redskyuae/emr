import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  createAyurvedaDiagnosisCodeSchema,
  type CreateAyurvedaDiagnosisCodeInput,
} from '../schemas/ayurveda-diagnosis-code-schema';
import { validateAyurvedaDiagnosisCodeReferences } from './ayurveda-diagnosis-code-reference-validator';

export async function validateCreateAyurvedaDiagnosisCode(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateAyurvedaDiagnosisCodeInput>> {
  const result = createAyurvedaDiagnosisCodeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const referenceResult = await validateAyurvedaDiagnosisCodeReferences({
    ...result.data,
    tenantId,
  });

  if (!referenceResult.success) {
    return referenceResult;
  }

  return { success: true, data: result.data };
}
