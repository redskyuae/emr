import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { clinicalNoteTypeRepository } from '../repository/clinical-note-type-repository';
import type { ClinicalNoteType } from '../schemas/clinical-note-type-schema';
import { getClinicalNoteTypeUniqueConstraintErrors } from '../validator/clinical-note-type-uniqueness-validator';
import { validateCreateClinicalNoteType } from '../validator/create-clinical-note-type-validator';

export async function createClinicalNoteTypeCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<ClinicalNoteType>> {
  const validationResult = await validateCreateClinicalNoteType(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const clinicalNoteTypeData = { ...validationResult.data, tenantId };

  try {
    const createdClinicalNoteType =
      await clinicalNoteTypeRepository.createClinicalNoteType(clinicalNoteTypeData);
    return { success: true, data: createdClinicalNoteType };
  } catch (error) {
    const constraintErrors = getClinicalNoteTypeUniqueConstraintErrors(error, clinicalNoteTypeData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
