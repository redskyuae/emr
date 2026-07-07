import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { patientRepository } from '../repository/patient-repository';
import type { Patient } from '../schemas/patient-schema';
import { validateGetPatientById } from '../validator/get-patient-by-id-validator';

export async function getPatientByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<Patient>> {
  const validationResult = validateGetPatientById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const patient = await patientRepository.getPatientById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!patient) {
    return { success: false, errors: ['Patient not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: patient };
}
