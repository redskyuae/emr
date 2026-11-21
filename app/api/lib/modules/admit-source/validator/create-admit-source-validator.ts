import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  createAdmitSourceSchema,
  type CreateAdmitSourceInput,
} from '../schemas/admit-source-schema';
import { validateAdmitSourceUniqueness } from './admit-source-uniqueness-validator';

export async function validateCreateAdmitSource(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateAdmitSourceInput>> {
  const result = createAdmitSourceSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateAdmitSourceUniqueness({
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
