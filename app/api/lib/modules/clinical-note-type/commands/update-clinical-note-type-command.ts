import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { clinicalNoteTypeRepository } from '../repository/clinical-note-type-repository';
import type { ClinicalNoteType } from '../schemas/clinical-note-type-schema';
import { getClinicalNoteTypeUniqueConstraintErrors } from '../validator/clinical-note-type-uniqueness-validator';
import { validateUpdateClinicalNoteType } from '../validator/update-clinical-note-type-validator';

export async function updateClinicalNoteTypeCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<ClinicalNoteType>> {
  const validationResult = await validateUpdateClinicalNoteType(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const clinicalNoteTypeData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedClinicalNoteType = await clinicalNoteTypeRepository.updateClinicalNoteType(
      validatedId,
      clinicalNoteTypeData
    );

    if (!updatedClinicalNoteType) {
      return {
        success: false,
        errors: ['Clinical note type not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedClinicalNoteType };
  } catch (error) {
    const constraintErrors = getClinicalNoteTypeUniqueConstraintErrors(error, clinicalNoteTypeData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
