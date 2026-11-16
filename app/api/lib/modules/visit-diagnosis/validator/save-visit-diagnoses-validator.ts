import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { visitRepository } from '../../visit/repository/visit-repository';
import type { VisitDiagnosisEntry } from '../schemas/visit-diagnosis-schema';
import {
  parseVisitDiagnosesPayload,
  validateVisitDiagnosisReferences,
} from './visit-diagnoses-payload-validator';

type SaveVisitDiagnosesParams = {
  visitId: number;
  diagnoses: VisitDiagnosisEntry[];
};

// Diagnoses of an Active Visit are edited here; a Completed Visit uses the amend path.
export async function validateSaveVisitDiagnoses(
  visitId: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<SaveVisitDiagnosesParams>> {
  const parsed = parseVisitDiagnosesPayload(visitId, payload);

  if (!parsed.success) {
    return parsed;
  }

  const visit = await visitRepository.getVisitById(parsed.data.visitId, tenantId);

  if (!visit) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  if (visit.status !== 'CHECKED_IN' && visit.status !== 'IN_CONSULTATION') {
    return {
      success: false,
      errors: [`Visit ${visit.visitNumber} is closed and cannot be edited.`],
      status: StatusCodes.CONFLICT,
    };
  }

  const referenceResult = await validateVisitDiagnosisReferences(
    tenantId,
    parsed.data.visitId,
    parsed.data.diagnoses
  );

  if (!referenceResult.success) {
    return referenceResult;
  }

  return { success: true, data: parsed.data };
}
