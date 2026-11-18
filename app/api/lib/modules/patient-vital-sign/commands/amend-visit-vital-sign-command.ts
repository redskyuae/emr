import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import { computeBmi, type PatientVitalSign } from '../schemas/patient-vital-sign-schema';
import { validateAmendVisitVitalSign } from '../validator/amend-visit-vital-sign-validator';

export async function amendVisitVitalSignCommand(
  visitId: unknown,
  vitalId: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<PatientVitalSign>> {
  const validationResult = await validateAmendVisitVitalSign(visitId, vitalId, payload, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const { id, payload: data, existingRecordedAt } = validationResult.data;
  const bmi = computeBmi(data.heightCm, data.weightKg);

  // The repository stamps "now" when recordedAt is absent; an amendment must
  // keep the original reading time unless the client corrects it.
  const amended = await patientVitalSignRepository.updatePatientVitalSign(id, {
    ...data,
    bmi,
    tenantId,
    recordedAt: data.recordedAt ?? existingRecordedAt,
  });

  if (!amended) {
    return { success: false, errors: ['Vital sign not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: amended };
}
