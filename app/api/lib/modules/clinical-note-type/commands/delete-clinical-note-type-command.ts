import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { clinicalNoteTypeRepository } from '../repository/clinical-note-type-repository';
import type { ClinicalNoteType } from '../schemas/clinical-note-type-schema';
import { validateDeleteClinicalNoteType } from '../validator/delete-clinical-note-type-validator';

export async function deleteClinicalNoteTypeCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<ClinicalNoteType>> {
  const validationResult = validateDeleteClinicalNoteType(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedClinicalNoteType = await clinicalNoteTypeRepository.deleteClinicalNoteType(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedClinicalNoteType) {
    return {
      success: false,
      errors: ['Clinical note type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedClinicalNoteType };
}
