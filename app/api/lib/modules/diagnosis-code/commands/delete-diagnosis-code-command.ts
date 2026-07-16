import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { diagnosisCodeRepository } from '../repository/diagnosis-code-repository';
import type { DiagnosisCode } from '../schemas/diagnosis-code-schema';
import { validateDeleteDiagnosisCode } from '../validator/delete-diagnosis-code-validator';

export async function deleteDiagnosisCodeCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<DiagnosisCode>> {
  const validationResult = validateDeleteDiagnosisCode(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedDiagnosisCode = await diagnosisCodeRepository.deleteDiagnosisCode(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedDiagnosisCode) {
    return {
      success: false,
      errors: ['Diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedDiagnosisCode };
}
