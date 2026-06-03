import type { ValidationResult } from '@/app/api/lib/utils/types';
import { languageIdSchema, type LanguageIdInput } from '../schemas/language-schema';
import { formatValidationErrors } from './validation-errors';

export function validateLanguageId(payload: unknown): ValidationResult<LanguageIdInput> {
  const result = languageIdSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
