import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';

const AYURVEDA_DIAGNOSIS_CODE_EXISTS = "Ayurveda diagnosis code '{value}' already exists.";

type AyurvedaDiagnosisCodeUniquenessInput = {
  tenantId: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateAyurvedaDiagnosisCodeUniqueness({
  tenantId,
  code,
  excludeId,
}: AyurvedaDiagnosisCodeUniquenessInput): Promise<ValidationResult<void>> {
  const existingCode = await ayurvedaDiagnosisCodeRepository.findActiveByCode(tenantId, code, {
    excludeId,
  });

  if (existingCode) {
    return {
      success: false,
      errors: [duplicateError(AYURVEDA_DIAGNOSIS_CODE_EXISTS, code)],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: undefined };
}

export function getAyurvedaDiagnosisCodeUniqueConstraintErrors(
  error: unknown,
  input: Pick<AyurvedaDiagnosisCodeUniquenessInput, 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'ayurveda_diagnosis_code_tenant_code_idx') {
    return [duplicateError(AYURVEDA_DIAGNOSIS_CODE_EXISTS, input.code)];
  }

  return [];
}
