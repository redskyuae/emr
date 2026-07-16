import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { patientRepository } from '../../patient/repository/patient-repository';

export async function validatePatientExistsForVitalSign(
  patientId: number,
  tenantId: string
): Promise<ValidationResult<void>> {
  const patient = await patientRepository.getPatientById(patientId, tenantId);

  if (!patient) {
    return { success: false, errors: ['Patient not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: undefined };
}
