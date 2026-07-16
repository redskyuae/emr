import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createClinicalNoteTypeSchema,
  type CreateClinicalNoteTypeInput,
} from '../schemas/clinical-note-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { validateClinicalNoteTypeUniqueness } from './clinical-note-type-uniqueness-validator';

export async function validateCreateClinicalNoteType(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateClinicalNoteTypeInput>> {
  const result = createClinicalNoteTypeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateClinicalNoteTypeUniqueness({
    ...result.data,
    tenantId,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return { success: true, data: result.data };
}
