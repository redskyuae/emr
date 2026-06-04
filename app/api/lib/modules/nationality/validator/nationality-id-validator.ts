import type { ValidationResult } from '@/app/api/lib/utils/types';
import { nationalityIdSchema, type NationalityIdInput } from '../schemas/nationality-schema';

export function validateNationalityId(payload: unknown): ValidationResult<NationalityIdInput> {
  const result = nationalityIdSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: [`NationalityId ${String(payload)} is Invalid`] };
  }

  return { success: true, data: result.data };
}
