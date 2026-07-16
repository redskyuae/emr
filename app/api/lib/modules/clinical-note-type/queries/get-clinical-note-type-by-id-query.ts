import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { clinicalNoteTypeRepository } from '../repository/clinical-note-type-repository';
import type { ClinicalNoteType } from '../schemas/clinical-note-type-schema';
import { validateGetClinicalNoteTypeById } from '../validator/get-clinical-note-type-by-id-validator';

export async function getClinicalNoteTypeByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<ClinicalNoteType>> {
  const validationResult = validateGetClinicalNoteTypeById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const clinicalNoteType = await clinicalNoteTypeRepository.getClinicalNoteTypeById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!clinicalNoteType) {
    return {
      success: false,
      errors: ['Clinical note type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: clinicalNoteType };
}
