import type { ValidationResult } from '@/app/api/lib/utils/types';
import { type UpdateStateInput, updateStateSchema } from '../schemas/state-schema';
import { formatValidationErrors } from './validation-errors';

export function validateUpdateState(payload: unknown): ValidationResult<UpdateStateInput> {
  const result = updateStateSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
