import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import type { ClinicalNote } from '../schemas/clinical-note-schema';
import { validateGetClinicalNoteById } from '../validator/get-clinical-note-by-id-validator';

export async function getClinicalNoteByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<ClinicalNote>> {
  const validationResult = validateGetClinicalNoteById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const note = await clinicalNoteRepository.getClinicalNoteById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!note) {
    return { success: false, errors: ['Clinical note not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: note };
}
