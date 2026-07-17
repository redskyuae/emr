import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  clinicalNoteIdSchema,
  createClinicalNoteSchema,
  type CreateClinicalNoteInput,
} from '../schemas/clinical-note-schema';
import { validateAdmissionForClinicalCapture } from '../../admission/validator/admission-clinical-capture-validator';
import { validateVisitForClinicalCapture } from '../../visit/validator/visit-clinical-capture-validator';
import {
  validateNoteTypeReference,
  validatePatientExistsForNote,
} from './clinical-note-reference-validator';

export async function validateCreateClinicalNote(
  patientId: unknown,
  tenantId: string,
  payload: unknown
): Promise<ValidationResult<{ patientId: number; payload: CreateClinicalNoteInput }>> {
  const patientIdResult = clinicalNoteIdSchema.safeParse(patientId);
  const payloadResult = createClinicalNoteSchema.safeParse(payload);

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

  const patientResult = await validatePatientExistsForNote(patientIdResult.data, tenantId);

  if (!patientResult.success) {
    return patientResult;
  }

  const noteTypeResult = await validateNoteTypeReference(payloadResult.data.noteTypeId, tenantId);

  if (!noteTypeResult.success) {
    return noteTypeResult;
  }

  if (payloadResult.data.visitId !== undefined && payloadResult.data.visitId !== null) {
    const visitResult = await validateVisitForClinicalCapture(
      payloadResult.data.visitId,
      patientIdResult.data,
      tenantId
    );

    if (!visitResult.success) {
      return visitResult;
    }
  }

  if (payloadResult.data.admissionId !== undefined && payloadResult.data.admissionId !== null) {
    const admissionResult = await validateAdmissionForClinicalCapture(
      payloadResult.data.admissionId,
      patientIdResult.data,
      tenantId
    );

    if (!admissionResult.success) {
      return admissionResult;
    }
  }

  return { success: true, data: { patientId: patientIdResult.data, payload: payloadResult.data } };
}
