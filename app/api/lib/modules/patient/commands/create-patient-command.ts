import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientRepository } from '../repository/patient-repository';
import type { Patient } from '../schemas/patient-schema';
import { validateCreatePatient } from '../validator/create-patient-validator';
import { getPatientUniqueConstraintErrors } from '../validator/patient-govt-id-validator';

export async function createPatientCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Patient>> {
  const validationResult = await validateCreatePatient(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const patientData = { ...validationResult.data, tenantId };

  try {
    const patient = await patientRepository.createPatient(patientData);

    return { success: true, data: patient };
  } catch (error) {
    const constraintErrors = getPatientUniqueConstraintErrors(error, patientData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
