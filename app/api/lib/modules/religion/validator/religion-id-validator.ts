import type { ValidationResult } from '@/app/api/lib/utils/types';
import { religionIdSchema, type ReligionIdInput } from '../schemas/religion-schema';

export function validateReligionId(payload: unknown): ValidationResult<ReligionIdInput> {
  const result = religionIdSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: [`Religion ${String(payload)} is Invalid.`] };
  }

  return { success: true, data: result.data };
}
