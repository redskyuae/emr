import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { visitRepository } from '../repository/visit-repository';

/**
 * Guards attaching a clinical record to a Visit. Shared by the Vital Sign and
 * Clinical Note modules so both enforce the same rule: the Visit must belong to
 * this Tenant and this Patient, and must still be open — a closed Visit is a
 * historical record, and a mismatched Patient means the record would land on
 * the wrong encounter.
 */
export async function validateVisitForClinicalCapture(
  visitId: number,
  patientId: number,
  tenantId: string
): Promise<ValidationResult<void>> {
  const visit = await visitRepository.getVisitForClinicalCapture(tenantId, visitId);

  if (!visit) {
    return {
      success: false,
      errors: [`Visit ${visitId} is Invalid.`],
      status: StatusCodes.BAD_REQUEST,
    };
  }

  if (visit.patientId !== patientId) {
    return {
      success: false,
      errors: [`Visit ${visitId} does not belong to patient ${patientId}.`],
      status: StatusCodes.BAD_REQUEST,
    };
  }

  if (visit.status !== 'CHECKED_IN' && visit.status !== 'IN_CONSULTATION') {
    return {
      success: false,
      errors: [`Visit ${visitId} is not active.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: undefined };
}
