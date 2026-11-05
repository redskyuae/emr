import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import type { AyurvedaDiagnosisCode } from '../schemas/ayurveda-diagnosis-code-schema';
import { getAyurvedaDiagnosisCodeUniqueConstraintErrors } from '../validator/ayurveda-diagnosis-code-uniqueness-validator';
import { validateCreateAyurvedaDiagnosisCode } from '../validator/create-ayurveda-diagnosis-code-validator';

export async function createAyurvedaDiagnosisCodeCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<AyurvedaDiagnosisCode>> {
  const validationResult = await validateCreateAyurvedaDiagnosisCode(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const ayurvedaDiagnosisCodeData = { ...validationResult.data, tenantId };

  try {
    const createdAyurvedaDiagnosisCode =
      await ayurvedaDiagnosisCodeRepository.createAyurvedaDiagnosisCode(ayurvedaDiagnosisCodeData);
    return { success: true, data: createdAyurvedaDiagnosisCode };
  } catch (error) {
    const constraintErrors = getAyurvedaDiagnosisCodeUniqueConstraintErrors(
      error,
      ayurvedaDiagnosisCodeData
    );

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
