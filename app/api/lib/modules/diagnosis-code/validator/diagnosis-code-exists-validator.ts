import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { diagnosisCodeRepository } from '../repository/diagnosis-code-repository';
import type { DiagnosisCode } from '../schemas/diagnosis-code-schema';
import { validateGetDiagnosisCodeById } from './get-diagnosis-code-by-id-validator';

export async function validateDiagnosisCodeExists(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<DiagnosisCode>> {
  const validationResult = validateGetDiagnosisCodeById(id, tenantId);

  if (!validationResult.success) {
    return validationResult;
  }

  const diagnosisCode = await diagnosisCodeRepository.getDiagnosisCodeById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!diagnosisCode) {
    return {
      success: false,
      errors: ['Diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: diagnosisCode };
}
