import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  createPatientMedicationSchema,
  patientMedicationIdSchema,
  type CreatePatientMedicationInput,
} from '../schemas/patient-medication-schema';
import { validatePatientExistsForMedication } from './patient-medication-reference-validator';

export async function validateCreatePatientMedication(
  patientId: unknown,
  tenantId: string,
  payload: unknown
): Promise<ValidationResult<{ patientId: number; payload: CreatePatientMedicationInput }>> {
  const patientIdResult = patientMedicationIdSchema.safeParse(patientId);
  const payloadResult = createPatientMedicationSchema.safeParse(payload);

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

  const patientResult = await validatePatientExistsForMedication(patientIdResult.data, tenantId);

  if (!patientResult.success) {
    return patientResult;
  }

  return { success: true, data: { patientId: patientIdResult.data, payload: payloadResult.data } };
}
