import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import type { AyurvedaDiagnosisCode } from '../schemas/ayurveda-diagnosis-code-schema';
import { validateAyurvedaDiagnosisCodeExists } from '../validator/ayurveda-diagnosis-code-exists-validator';

export async function deactivateAyurvedaDiagnosisCodeCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<AyurvedaDiagnosisCode>> {
  const validationResult = await validateAyurvedaDiagnosisCodeExists(id, tenantId);

  if (!validationResult.success) {
    return validationResult;
  }

  const { id: ayurvedaDiagnosisCodeId, tenantId: ayurvedaDiagnosisCodeTenantId } =
    validationResult.data;
  const ayurvedaDiagnosisCode =
    await ayurvedaDiagnosisCodeRepository.setAyurvedaDiagnosisCodeActive(
      ayurvedaDiagnosisCodeId,
      ayurvedaDiagnosisCodeTenantId,
      false
    );

  if (!ayurvedaDiagnosisCode) {
    return {
      success: false,
      errors: ['Ayurveda diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: ayurvedaDiagnosisCode };
}
