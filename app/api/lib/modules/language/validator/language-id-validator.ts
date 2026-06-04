import type { ValidationResult } from '@/app/api/lib/utils/types';
import { languageIdSchema, type LanguageIdInput } from '../schemas/language-schema';

export function validateLanguageId(payload: unknown): ValidationResult<LanguageIdInput> {
  const result = languageIdSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: [`LanguageId ${String(payload)} is Invalid.`] };
  }

  return { success: true, data: result.data };
}
