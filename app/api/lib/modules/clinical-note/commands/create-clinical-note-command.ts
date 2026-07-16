import type { CommandResult } from '@/app/api/lib/utils/types';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import type { ClinicalNote } from '../schemas/clinical-note-schema';
import { validateCreateClinicalNote } from '../validator/create-clinical-note-validator';

export async function createClinicalNoteCommand(
  patientId: unknown,
  tenantId: string,
  authorUserId: string,
  payload: unknown
): Promise<CommandResult<ClinicalNote>> {
  const validationResult = await validateCreateClinicalNote(patientId, tenantId, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const created = await clinicalNoteRepository.createClinicalNote({
    ...validationResult.data.payload,
    tenantId,
    patientId: validationResult.data.patientId,
    authorUserId,
    recordedByUserId: authorUserId,
  });

  return { success: true, data: created };
}
