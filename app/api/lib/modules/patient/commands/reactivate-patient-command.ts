import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientRepository } from '../repository/patient-repository';
import type { Patient } from '../schemas/patient-schema';
import { validatePatientExists } from '../validator/patient-existence-validator';

export async function reactivatePatientCommand(
  id: unknown,
  tenantId: string
): Promise<CommandResult<Patient>> {
  const validationResult = await validatePatientExists(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const reactivatedPatient = await patientRepository.setPatientActive(
    validationResult.data,
    tenantId,
    true
  );

  if (!reactivatedPatient) {
    return { success: false, errors: ['Patient not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: reactivatedPatient };
}
