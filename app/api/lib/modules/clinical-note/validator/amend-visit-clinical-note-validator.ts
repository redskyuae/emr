import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitIdSchema } from '../../visit/schemas/visit-schema';
import { validateVisitForAmendment } from '../../visit/validator/visit-amendment-validator';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import {
  clinicalNoteIdSchema,
  amendVisitClinicalNoteSchema,
  type AmendVisitClinicalNoteInput,
} from '../schemas/clinical-note-schema';
import { validateNoteTypeReference } from './clinical-note-reference-validator';

type AmendVisitClinicalNoteParams = {
  id: number;
  payload: AmendVisitClinicalNoteInput;
};

/**
 * Amending a Completed Visit's Clinical Note is the one path that may rewrite a
 * signed note. The note must already belong to that Visit; the Visit link itself
 * cannot change.
 */
export async function validateAmendVisitClinicalNote(
  visitId: unknown,
  noteId: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<AmendVisitClinicalNoteParams>> {
  const visitIdResult = visitIdSchema.safeParse(visitId);
  const noteIdResult = clinicalNoteIdSchema.safeParse(noteId);
  const payloadResult = amendVisitClinicalNoteSchema.safeParse(payload);

  if (!visitIdResult.success || !noteIdResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!visitIdResult.success) {
      errors.push(`Visit ${String(visitId)} is Invalid.`);
    }

    if (!noteIdResult.success) {
      errors.push(`Clinical note ${String(noteId)} is Invalid.`);
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

  const existing = await clinicalNoteRepository.getClinicalNoteById(noteIdResult.data, tenantId);

  if (!existing || existing.visitId !== visitIdResult.data) {
    return { success: false, errors: ['Clinical note not found'], status: StatusCodes.NOT_FOUND };
  }

  const noteTypeResult = await validateNoteTypeReference(payloadResult.data.noteTypeId, tenantId);

  if (!noteTypeResult.success) {
    return noteTypeResult;
  }

  return { success: true, data: { id: noteIdResult.data, payload: payloadResult.data } };
}
