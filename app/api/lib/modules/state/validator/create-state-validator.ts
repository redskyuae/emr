import type { ValidationResult } from '@/app/api/lib/utils/types';
import { createStateSchema, type CreateStateInput } from '../schemas/state-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateCreateState(payload: unknown): ValidationResult<CreateStateInput> {
  const result = createStateSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
