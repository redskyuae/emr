import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import type { AyurvedaDiagnosisCode } from '../schemas/ayurveda-diagnosis-code-schema';
import { getAyurvedaDiagnosisCodeUniqueConstraintErrors } from '../validator/ayurveda-diagnosis-code-reference-validator';
import { validateUpdateAyurvedaDiagnosisCode } from '../validator/update-ayurveda-diagnosis-code-validator';

export async function updateAyurvedaDiagnosisCodeCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<AyurvedaDiagnosisCode>> {
  const validationResult = await validateUpdateAyurvedaDiagnosisCode(id, payload, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const data = { ...validationResult.data.payload, tenantId };

  try {
    const updated = await ayurvedaDiagnosisCodeRepository.updateAyurvedaDiagnosisCode(
      validationResult.data.id,
      data
    );

    if (!updated) {
      return {
        success: false,
        errors: ['Ayurveda diagnosis code not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updated };
  } catch (error) {
    const constraintErrors = getAyurvedaDiagnosisCodeUniqueConstraintErrors(error, data);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
