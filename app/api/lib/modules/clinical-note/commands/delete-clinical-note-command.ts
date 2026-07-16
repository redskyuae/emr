import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import type { ClinicalNote } from '../schemas/clinical-note-schema';
import { validateDeleteClinicalNote } from '../validator/delete-clinical-note-validator';

export async function deleteClinicalNoteCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<ClinicalNote>> {
  const validationResult = validateDeleteClinicalNote(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deleted = await clinicalNoteRepository.deleteClinicalNote(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deleted) {
    return { success: false, errors: ['Clinical note not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: deleted };
}
