import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { clinicalNoteTypeRepository } from '../repository/clinical-note-type-repository';
import type { ClinicalNoteType } from '../schemas/clinical-note-type-schema';
import { validateGetClinicalNoteTypes } from '../validator/get-clinical-note-types-validator';

export type GetClinicalNoteTypesParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: unknown;
};

export async function getClinicalNoteTypesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetClinicalNoteTypesParams): Promise<ListQueryResult<ClinicalNoteType>> {
  const tenantIdValidationResult = validateGetClinicalNoteTypes(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await clinicalNoteTypeRepository.getClinicalNoteTypes({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
