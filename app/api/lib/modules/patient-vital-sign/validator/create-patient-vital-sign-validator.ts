import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  createPatientVitalSignSchema,
  patientVitalSignIdSchema,
  type CreatePatientVitalSignInput,
} from '../schemas/patient-vital-sign-schema';
import { validatePatientExistsForVitalSign } from './patient-vital-sign-reference-validator';

export async function validateCreatePatientVitalSign(
  patientId: unknown,
  tenantId: string,
  payload: unknown
): Promise<ValidationResult<{ patientId: number; payload: CreatePatientVitalSignInput }>> {
  const patientIdResult = patientVitalSignIdSchema.safeParse(patientId);
  const payloadResult = createPatientVitalSignSchema.safeParse(payload);

  if (!patientIdResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!patientIdResult.success) {
      errors.push(`Patient ${String(patientId)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const patientResult = await validatePatientExistsForVitalSign(patientIdResult.data, tenantId);

  if (!patientResult.success) {
    return patientResult;
  }

  return { success: true, data: { patientId: patientIdResult.data, payload: payloadResult.data } };
}
