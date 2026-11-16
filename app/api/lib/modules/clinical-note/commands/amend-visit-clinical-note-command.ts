import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import type { ClinicalNote } from '../schemas/clinical-note-schema';
import { validateAmendVisitClinicalNote } from '../validator/amend-visit-clinical-note-validator';

// Rewrites the note type and SOAP sections only. The repository update leaves
// status and signedAt alone and preserves the Visit link when none is supplied.
export async function amendVisitClinicalNoteCommand(
  visitId: unknown,
  noteId: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<ClinicalNote>> {
  const validationResult = await validateAmendVisitClinicalNote(visitId, noteId, payload, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const amended = await clinicalNoteRepository.updateClinicalNote(validationResult.data.id, {
    ...validationResult.data.payload,
    tenantId,
  });

  if (!amended) {
    return { success: false, errors: ['Clinical note not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: amended };
}
