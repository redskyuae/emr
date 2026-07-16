import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import type { PatientVitalSign } from '../schemas/patient-vital-sign-schema';
import { validateGetPatientVitalSignById } from '../validator/get-patient-vital-sign-by-id-validator';

export async function getPatientVitalSignByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<PatientVitalSign>> {
  const validationResult = validateGetPatientVitalSignById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const vitalSign = await patientVitalSignRepository.getPatientVitalSignById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!vitalSign) {
    return { success: false, errors: ['Vital sign not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: vitalSign };
}
