import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  clinicalNoteIdSchema,
  createClinicalNoteSchema,
  type CreateClinicalNoteInput,
} from '../schemas/clinical-note-schema';
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

  return { success: true, data: { patientId: patientIdResult.data, payload: payloadResult.data } };
}
