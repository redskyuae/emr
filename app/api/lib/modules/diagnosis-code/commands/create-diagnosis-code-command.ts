import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { diagnosisCodeRepository } from '../repository/diagnosis-code-repository';
import type { DiagnosisCode } from '../schemas/diagnosis-code-schema';
import { getDiagnosisCodeUniqueConstraintErrors } from '../validator/diagnosis-code-uniqueness-validator';
import { validateCreateDiagnosisCode } from '../validator/create-diagnosis-code-validator';

export async function createDiagnosisCodeCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<DiagnosisCode>> {
  const validationResult = await validateCreateDiagnosisCode(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const diagnosisCodeData = { ...validationResult.data, tenantId };

  try {
    const createdDiagnosisCode =
      await diagnosisCodeRepository.createDiagnosisCode(diagnosisCodeData);
    return { success: true, data: createdDiagnosisCode };
  } catch (error) {
    const constraintErrors = getDiagnosisCodeUniqueConstraintErrors(error, diagnosisCodeData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
