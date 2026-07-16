import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { diagnosisCodeRepository } from '../repository/diagnosis-code-repository';
import type { DiagnosisCode } from '../schemas/diagnosis-code-schema';
import { validateGetDiagnosisCodeById } from '../validator/get-diagnosis-code-by-id-validator';

export async function getDiagnosisCodeByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<DiagnosisCode>> {
  const validationResult = validateGetDiagnosisCodeById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
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
