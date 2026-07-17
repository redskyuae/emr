import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import {
  patientVitalSignIdSchema,
  updatePatientVitalSignSchema,
  type UpdatePatientVitalSignInput,
} from '../schemas/patient-vital-sign-schema';
import { validateAdmissionForClinicalCapture } from '../../admission/validator/admission-clinical-capture-validator';
import { validateVisitForClinicalCapture } from '../../visit/validator/visit-clinical-capture-validator';

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

  // The foreign key only proves the Visit row exists — it cannot stop an update
  // relinking this observation to another Patient's or Tenant's Visit, so re-run
  // the same guard the create path uses, against the record's own Patient.
  if (payloadResult.data.visitId !== undefined && payloadResult.data.visitId !== null) {
    const visitResult = await validateVisitForClinicalCapture(
      payloadResult.data.visitId,
      existing.patientId,
      tenantId
    );

    if (!visitResult.success) {
      return visitResult;
    }
  }

  if (payloadResult.data.admissionId !== undefined && payloadResult.data.admissionId !== null) {
    const admissionResult = await validateAdmissionForClinicalCapture(
      payloadResult.data.admissionId,
      existing.patientId,
      tenantId
    );

    if (!admissionResult.success) {
      return admissionResult;
    }
  }

  return { success: true, data: { id: idResult.data, payload: payloadResult.data } };
}
