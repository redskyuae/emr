import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { patientMedicationRepository } from '../repository/patient-medication-repository';
import {
  patientMedicationIdSchema,
  updatePatientMedicationSchema,
  type UpdatePatientMedicationInput,
} from '../schemas/patient-medication-schema';

export type UpdatePatientMedicationParams = {
  id: number;
  payload: UpdatePatientMedicationInput;
};

export async function validateUpdatePatientMedication(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdatePatientMedicationParams>> {
  const idResult = patientMedicationIdSchema.safeParse(id);
  const payloadResult = updatePatientMedicationSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Medication ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existing = await patientMedicationRepository.getPatientMedicationById(
    idResult.data,
    tenantId
  );

  if (!existing) {
    return { success: false, errors: ['Medication not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: { id: idResult.data, payload: payloadResult.data } };
}
