import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import {
  clinicalNoteIdSchema,
  updateClinicalNoteSchema,
  type UpdateClinicalNoteInput,
} from '../schemas/clinical-note-schema';
import { validateVisitForClinicalCapture } from '../../visit/validator/visit-clinical-capture-validator';
import { validateNoteTypeReference } from './clinical-note-reference-validator';

export type UpdateClinicalNoteParams = {
  id: number;
  payload: UpdateClinicalNoteInput;
};

export async function validateUpdateClinicalNote(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateClinicalNoteParams>> {
  const idResult = clinicalNoteIdSchema.safeParse(id);
  const payloadResult = updateClinicalNoteSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Clinical note ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existing = await clinicalNoteRepository.getClinicalNoteById(idResult.data, tenantId);

  if (!existing) {
    return { success: false, errors: ['Clinical note not found'], status: StatusCodes.NOT_FOUND };
  }

  if (existing.status === 'signed') {
    return {
      success: false,
      errors: [`Clinical note ${idResult.data} is signed and cannot be edited.`],
      status: StatusCodes.CONFLICT,
    };
  }

  const noteTypeResult = await validateNoteTypeReference(payloadResult.data.noteTypeId, tenantId);

  if (!noteTypeResult.success) {
    return noteTypeResult;
  }

  // The foreign key only proves the Visit row exists — it cannot stop an update
  // relinking this note to another Patient's or Tenant's Visit, so re-run the
  // same guard the create path uses, against the note's own Patient.
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

  return { success: true, data: { id: idResult.data, payload: payloadResult.data } };
}
