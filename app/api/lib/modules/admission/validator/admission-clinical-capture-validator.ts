import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { admissionRepository } from '../repository/admission-repository';

/**
 * Guards attaching a clinical record to an Admission. Shared by the Vital Sign
 * and Clinical Note modules so both enforce the same rule: the Admission must
 * belong to this Tenant and this Patient, and must still be active — a closed
 * Admission is a historical record, and a mismatched Patient means the record
 * would land on the wrong stay.
 */
export async function validateAdmissionForClinicalCapture(
  admissionId: number,
  patientId: number,
  tenantId: string
): Promise<ValidationResult<void>> {
  const admission = await admissionRepository.getAdmissionForClinicalCapture(tenantId, admissionId);

  if (!admission) {
    return {
      success: false,
      errors: [`Admission ${admissionId} is Invalid.`],
      status: StatusCodes.BAD_REQUEST,
    };
  }

  if (admission.patientId !== patientId) {
    return {
      success: false,
      errors: [`Admission ${admissionId} does not belong to patient ${patientId}.`],
      status: StatusCodes.BAD_REQUEST,
    };
  }

  if (admission.status !== 'ADMITTED') {
    return {
      success: false,
      errors: [`Admission ${admissionId} is not active.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: undefined };
}
