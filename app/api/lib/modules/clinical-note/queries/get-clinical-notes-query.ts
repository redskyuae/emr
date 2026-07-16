import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import type { ClinicalNote } from '../schemas/clinical-note-schema';
import { validateGetClinicalNotes } from '../validator/get-clinical-notes-validator';

export type GetClinicalNotesParams = {
  patientId: unknown;
  tenantId: unknown;
  page?: number;
  limit?: number;
};

export async function getClinicalNotesQuery({
  patientId,
  tenantId,
  page,
  limit,
}: GetClinicalNotesParams): Promise<ListQueryResult<ClinicalNote>> {
  const validationResult = validateGetClinicalNotes(patientId, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { data, total } = await clinicalNoteRepository.getClinicalNotes({
    tenantId: validationResult.data.tenantId,
    patientId: validationResult.data.patientId,
    page,
    limit,
  });

  return { success: true, data, total };
}
