import type { ValidationResult } from '@/app/api/lib/utils/types';
import { createLanguageSchema, type CreateLanguageInput } from '../schemas/language-schema';
import { formatValidationErrors } from './validation-errors';

export function validateCreateLanguage(payload: unknown): ValidationResult<CreateLanguageInput> {
  const result = createLanguageSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
