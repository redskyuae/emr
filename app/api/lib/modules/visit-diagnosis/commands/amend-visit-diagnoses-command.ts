import { StatusCodes } from 'http-status-codes';

import type { CommandResultWith } from '@/app/api/lib/utils/types';
import { visitDiagnosisRepository } from '../repository/visit-diagnosis-repository';
import type { VisitDiagnosis } from '../schemas/visit-diagnosis-schema';
import { validateAmendVisitDiagnoses } from '../validator/amend-visit-diagnoses-validator';
import { getVisitDiagnosisConstraintErrors } from '../validator/visit-diagnoses-payload-validator';

export async function amendVisitDiagnosesCommand(
  visitId: unknown,
  tenantId: string,
  payload: unknown
  // `visitCompletedAt` is internal only (analytics); the response returns `data` alone.
): Promise<CommandResultWith<VisitDiagnosis[], { visitCompletedAt: Date | null }>> {
  const validationResult = await validateAmendVisitDiagnoses(visitId, payload, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  try {
    const saved = await visitDiagnosisRepository.replaceVisitDiagnoses(
      tenantId,
      validationResult.data.visitId,
      validationResult.data.diagnoses
    );

    return { success: true, data: saved, visitCompletedAt: validationResult.data.visitCompletedAt };
  } catch (error) {
    const constraintErrors = getVisitDiagnosisConstraintErrors(error);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
