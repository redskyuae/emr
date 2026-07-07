import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientRepository } from '../repository/patient-repository';
import { validatePatientExists } from '../validator/patient-existence-validator';

export async function deletePatientCommand(
  id: unknown,
  tenantId: string
): Promise<CommandResult<void>> {
  const validationResult = await validatePatientExists(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deletedPatient = await patientRepository.deletePatient(validationResult.data, tenantId);

  if (!deletedPatient) {
    return { success: false, errors: ['Patient not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: undefined };
}
