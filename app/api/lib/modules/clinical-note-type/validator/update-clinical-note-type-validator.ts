import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  type UpdateClinicalNoteTypeInput,
  updateClinicalNoteTypeSchema,
  clinicalNoteTypeIdSchema,
} from '../schemas/clinical-note-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { clinicalNoteTypeRepository } from '../repository/clinical-note-type-repository';
import { validateClinicalNoteTypeUniqueness } from './clinical-note-type-uniqueness-validator';

export type UpdateClinicalNoteTypeParams = {
  id: number;
  payload: UpdateClinicalNoteTypeInput;
};

export async function validateUpdateClinicalNoteType(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateClinicalNoteTypeParams>> {
  const idResult = clinicalNoteTypeIdSchema.safeParse(id);
  const payloadResult = updateClinicalNoteTypeSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Clinical note type ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingClinicalNoteType = await clinicalNoteTypeRepository.getClinicalNoteTypeById(
    idResult.data,
    tenantId
  );

  if (!existingClinicalNoteType) {
    return {
      success: false,
      errors: ['Clinical note type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateClinicalNoteTypeUniqueness({
    ...payloadResult.data,
    tenantId,
    excludeId: idResult.data,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      payload: payloadResult.data,
    },
  };
}
