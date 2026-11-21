import { StatusCodes } from 'http-status-codes';
import type { CommandResultWith } from '@/app/api/lib/utils/types';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import type { ClinicalNote } from '../schemas/clinical-note-schema';
import { validateSignClinicalNote } from '../validator/sign-clinical-note-validator';

export async function signClinicalNoteCommand(
  id: unknown,
  tenantId: unknown
  // `noteTypeCode` is internal only (analytics); the response returns `data` alone.
): Promise<CommandResultWith<ClinicalNote, { noteTypeCode: string | null }>> {
  const validationResult = await validateSignClinicalNote(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const signed = await clinicalNoteRepository.signClinicalNote(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!signed) {
    return { success: false, errors: ['Clinical note not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: signed, noteTypeCode: validationResult.data.noteTypeCode };
}
