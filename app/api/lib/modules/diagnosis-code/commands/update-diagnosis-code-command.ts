import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { diagnosisCodeRepository } from '../repository/diagnosis-code-repository';
import type { DiagnosisCode } from '../schemas/diagnosis-code-schema';
import { getDiagnosisCodeUniqueConstraintErrors } from '../validator/diagnosis-code-uniqueness-validator';
import { validateUpdateDiagnosisCode } from '../validator/update-diagnosis-code-validator';

export async function updateDiagnosisCodeCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<DiagnosisCode>> {
  const validationResult = await validateUpdateDiagnosisCode(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const diagnosisCodeData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedDiagnosisCode = await diagnosisCodeRepository.updateDiagnosisCode(
      validatedId,
      diagnosisCodeData
    );

    if (!updatedDiagnosisCode) {
      return {
        success: false,
        errors: ['Diagnosis code not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedDiagnosisCode };
  } catch (error) {
    const constraintErrors = getDiagnosisCodeUniqueConstraintErrors(error, diagnosisCodeData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
