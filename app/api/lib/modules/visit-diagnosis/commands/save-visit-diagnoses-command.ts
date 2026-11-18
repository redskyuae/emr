import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitDiagnosisRepository } from '../repository/visit-diagnosis-repository';
import type { VisitDiagnosis } from '../schemas/visit-diagnosis-schema';
import { validateSaveVisitDiagnoses } from '../validator/save-visit-diagnoses-validator';
import { getVisitDiagnosisConstraintErrors } from '../validator/visit-diagnoses-payload-validator';

export async function saveVisitDiagnosesCommand(
  visitId: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<VisitDiagnosis[]>> {
  const validationResult = await validateSaveVisitDiagnoses(visitId, payload, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  try {
    const saved = await visitDiagnosisRepository.replaceVisitDiagnoses(
      tenantId,
      validationResult.data.visitId,
      validationResult.data.diagnoses
    );

    return { success: true, data: saved };
  } catch (error) {
    const constraintErrors = getVisitDiagnosisConstraintErrors(error);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
