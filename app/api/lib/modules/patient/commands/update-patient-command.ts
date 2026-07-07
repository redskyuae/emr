import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientRepository } from '../repository/patient-repository';
import type { Patient } from '../schemas/patient-schema';
import { getPatientUniqueConstraintErrors } from '../validator/patient-govt-id-validator';
import { validateUpdatePatient } from '../validator/update-patient-validator';

export async function updatePatientCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Patient>> {
  const validationResult = await validateUpdatePatient(id, tenantId, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const patientData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedPatient = await patientRepository.updatePatient(
      validationResult.data.id,
      patientData
    );

    if (!updatedPatient) {
      return { success: false, errors: ['Patient not found'], status: StatusCodes.NOT_FOUND };
    }

    return { success: true, data: updatedPatient };
  } catch (error) {
    const constraintErrors = getPatientUniqueConstraintErrors(error, patientData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
