import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { patientRepository } from '../repository/patient-repository';
import { isRealEmiratesId } from '../schemas/patient-schema';

const PATIENT_EMIRATES_ID_EXISTS = 'Patient Emirates ID {value} already exists.';
const PATIENT_MRN_CONFLICT = 'Patient MRN allocation conflicted. Please retry.';

type PatientEmiratesIdInput = {
  tenantId: string;
  excludeId?: number;
  emiratesId?: string;
};

function duplicateError(value: string) {
  return PATIENT_EMIRATES_ID_EXISTS.replace('{value}', value);
}

// Unlike Identity Documents, which carry no uniqueness constraint, an Emirates
// ID is issued once per person and persists for life — two active Patients
// sharing one is never legitimate, and blocking it tells the front desk the
// patient already has a chart rather than letting them open a second (ADR 0042).
export async function validatePatientEmiratesIdUniqueness({
  tenantId,
  emiratesId,
  excludeId,
}: PatientEmiratesIdInput): Promise<ValidationResult<void>> {
  if (!emiratesId || !isRealEmiratesId(emiratesId)) {
    return { success: true, data: undefined };
  }

  const existingPatient = await patientRepository.findActiveByEmiratesId(tenantId, emiratesId, {
    excludeId,
  });

  if (existingPatient) {
    return {
      success: false,
      errors: [duplicateError(emiratesId)],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: undefined };
}

export function getPatientUniqueConstraintErrors(
  error: unknown,
  input: Pick<PatientEmiratesIdInput, 'emiratesId'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'patient_tenant_emirates_id_idx' && input.emiratesId) {
    return [duplicateError(input.emiratesId)];
  }

  if (dbError.constraint === 'patient_tenant_mrn_idx') {
    return [PATIENT_MRN_CONFLICT];
  }

  return [];
}
