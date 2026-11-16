import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import { validateAyurvedaDiagnosisCodeId } from '../validator/ayurveda-diagnosis-code-id-validator';

export async function deleteAyurvedaDiagnosisCodeCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<{ id: number }>> {
  const validationResult = validateAyurvedaDiagnosisCodeId(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deleted = await ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deleted) {
    return {
      success: false,
      errors: ['Ayurveda diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deleted };
}
