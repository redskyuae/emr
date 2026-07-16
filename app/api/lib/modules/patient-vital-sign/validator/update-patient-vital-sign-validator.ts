import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import {
  patientVitalSignIdSchema,
  updatePatientVitalSignSchema,
  type UpdatePatientVitalSignInput,
} from '../schemas/patient-vital-sign-schema';

export type UpdatePatientVitalSignParams = {
  id: number;
  payload: UpdatePatientVitalSignInput;
};

export async function validateUpdatePatientVitalSign(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdatePatientVitalSignParams>> {
  const idResult = patientVitalSignIdSchema.safeParse(id);
  const payloadResult = updatePatientVitalSignSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Vital sign ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existing = await patientVitalSignRepository.getPatientVitalSignById(
    idResult.data,
    tenantId
  );

  if (!existing) {
    return { success: false, errors: ['Vital sign not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: { id: idResult.data, payload: payloadResult.data } };
}
