import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { patientRepository } from '../repository/patient-repository';

const PATIENT_GOVT_ID_EXISTS = 'Patient government ID {value} already exists.';
const PATIENT_MRN_CONFLICT = 'Patient MRN allocation conflicted. Please retry.';

type PatientGovtIdInput = {
  tenantId: string;
  excludeId?: number;
  govtIdType?: string;
  govtIdNumber?: string;
};

function duplicateError(value: string) {
  return PATIENT_GOVT_ID_EXISTS.replace('{value}', value);
}

export async function validatePatientGovtIdUniqueness({
  tenantId,
  govtIdType,
  govtIdNumber,
  excludeId,
}: PatientGovtIdInput): Promise<ValidationResult<void>> {
  if (!govtIdType || !govtIdNumber) {
    return { success: true, data: undefined };
  }

  const existingPatient = await patientRepository.findActiveByGovtId(
    tenantId,
    govtIdType,
    govtIdNumber,
    { excludeId }
  );

  if (existingPatient) {
    return {
      success: false,
      errors: [duplicateError(govtIdNumber)],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: undefined };
}

export function getPatientUniqueConstraintErrors(
  error: unknown,
  input: Pick<PatientGovtIdInput, 'govtIdNumber'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'patient_tenant_govt_id_idx' && input.govtIdNumber) {
    return [duplicateError(input.govtIdNumber)];
  }

  if (dbError.constraint === 'patient_tenant_mrn_idx') {
    return [PATIENT_MRN_CONFLICT];
  }

  return [];
}
