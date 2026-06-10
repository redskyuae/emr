import type { ValidationResult } from '@/app/api/lib/utils/types';
import { type UpdateLanguageInput, updateLanguageSchema } from '../schemas/language-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateUpdateLanguage(payload: unknown): ValidationResult<UpdateLanguageInput> {
  const result = updateLanguageSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
