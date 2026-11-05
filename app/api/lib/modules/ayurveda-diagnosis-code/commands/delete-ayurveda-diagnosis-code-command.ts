import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import type { AyurvedaDiagnosisCode } from '../schemas/ayurveda-diagnosis-code-schema';
import { validateDeleteAyurvedaDiagnosisCode } from '../validator/delete-ayurveda-diagnosis-code-validator';

export async function deleteAyurvedaDiagnosisCodeCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<AyurvedaDiagnosisCode>> {
  const validationResult = validateDeleteAyurvedaDiagnosisCode(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedAyurvedaDiagnosisCode =
    await ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(
      validationResult.data.id,
      validationResult.data.tenantId
    );

  if (!deletedAyurvedaDiagnosisCode) {
    return {
      success: false,
      errors: ['Ayurveda diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedAyurvedaDiagnosisCode };
}
