import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitIdSchema } from '../../visit/schemas/visit-schema';
import { validateVisitForAmendment } from '../../visit/validator/visit-amendment-validator';
import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import {
  patientVitalSignIdSchema,
  amendVisitVitalSignSchema,
  type AmendVisitVitalSignInput,
} from '../schemas/patient-vital-sign-schema';

type AmendVisitVitalSignParams = {
  id: number;
  payload: AmendVisitVitalSignInput;
  existingRecordedAt: Date;
  /** When the amended Visit was completed; reported with the amendment, not written. */
  visitCompletedAt: Date | null;
};

/**
 * Amending a Completed Visit's Vital Sign reading. The reading must already
 * belong to that Visit; the Visit link itself cannot change. The existing
 * recordedAt is carried forward so an omitted value keeps the original time.
 */
export async function validateAmendVisitVitalSign(
  visitId: unknown,
  vitalId: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<AmendVisitVitalSignParams>> {
  const visitIdResult = visitIdSchema.safeParse(visitId);
  const vitalIdResult = patientVitalSignIdSchema.safeParse(vitalId);
  const payloadResult = amendVisitVitalSignSchema.safeParse(payload);

  if (!visitIdResult.success || !vitalIdResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!visitIdResult.success) {
      errors.push(`Visit ${String(visitId)} is Invalid.`);
    }

    if (!vitalIdResult.success) {
      errors.push(`Vital sign ${String(vitalId)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const visitResult = await validateVisitForAmendment(visitIdResult.data, tenantId);

  if (!visitResult.success) {
    return visitResult;
  }

  const existing = await patientVitalSignRepository.getPatientVitalSignById(
    vitalIdResult.data,
    tenantId
  );

  if (!existing || existing.visitId !== visitIdResult.data) {
    return { success: false, errors: ['Vital sign not found'], status: StatusCodes.NOT_FOUND };
  }

  return {
    success: true,
    data: {
      id: vitalIdResult.data,
      payload: payloadResult.data,
      existingRecordedAt: existing.recordedAt,
      visitCompletedAt: visitResult.data.completedAt,
    },
  };
}
