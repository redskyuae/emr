import { StatusCodes } from 'http-status-codes';

import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { diagnosisCodeRepository } from '../../diagnosis-code/repository/diagnosis-code-repository';
import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';

type AyurvedaDiagnosisCodeReferenceInput = {
  code: string;
  tenantId: string;
  excludeId?: number;
  icdDiagnosisCodeId: number | null;
};

function duplicateCodeError(code: string) {
  return `Ayurveda diagnosis code ${code} already exists.`;
}

/**
 * Repository-backed checks shared by create and update: the code must be unique
 * among the Tenant's active Ayurveda Diagnosis Codes, and a mapped ICD-10-CM
 * Diagnosis Code must exist in the Tenant.
 */
export async function validateAyurvedaDiagnosisCodeReferences({
  code,
  tenantId,
  excludeId,
  icdDiagnosisCodeId,
}: AyurvedaDiagnosisCodeReferenceInput): Promise<ValidationResult<void>> {
  const [existingCode, icdDiagnosisCode] = await Promise.all([
    ayurvedaDiagnosisCodeRepository.findActiveByCode(tenantId, code, { excludeId }),
    icdDiagnosisCodeId === null
      ? undefined
      : diagnosisCodeRepository.getDiagnosisCodeById(icdDiagnosisCodeId, tenantId),
  ]);
  const errors: string[] = [];

  if (existingCode) {
    errors.push(duplicateCodeError(code));
  }

  if (icdDiagnosisCodeId !== null && !icdDiagnosisCode) {
    errors.push(`Diagnosis code ${icdDiagnosisCodeId} is Invalid.`);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getAyurvedaDiagnosisCodeUniqueConstraintErrors(
  error: unknown,
  input: Pick<AyurvedaDiagnosisCodeReferenceInput, 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (
    dbError?.code === '23505' &&
    dbError.constraint === 'ayurveda_diagnosis_code_tenant_code_idx'
  ) {
    return [duplicateCodeError(input.code)];
  }

  return [];
}
