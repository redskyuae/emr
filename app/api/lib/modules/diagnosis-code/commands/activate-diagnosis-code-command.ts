import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { diagnosisCodeRepository } from '../repository/diagnosis-code-repository';
import type { DiagnosisCode } from '../schemas/diagnosis-code-schema';
import { validateDiagnosisCodeExists } from '../validator/diagnosis-code-exists-validator';

export async function activateDiagnosisCodeCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<DiagnosisCode>> {
  const validationResult = await validateDiagnosisCodeExists(id, tenantId);

  if (!validationResult.success) {
    return validationResult;
  }

  const { id: diagnosisCodeId, tenantId: diagnosisCodeTenantId } = validationResult.data;
  const diagnosisCode = await diagnosisCodeRepository.setDiagnosisCodeActive(
    diagnosisCodeId,
    diagnosisCodeTenantId,
    true
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
