import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import type { ClinicalNote } from '../schemas/clinical-note-schema';
import { validateUpdateClinicalNote } from '../validator/update-clinical-note-validator';

export async function updateClinicalNoteCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<ClinicalNote>> {
  const validationResult = await validateUpdateClinicalNote(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const updated = await clinicalNoteRepository.updateClinicalNote(validationResult.data.id, {
    ...validationResult.data.payload,
    tenantId,
  });

  if (!updated) {
    return { success: false, errors: ['Clinical note not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: updated };
}
