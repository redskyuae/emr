import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { createRoleSchema, type CreateRoleInput } from '../schemas/role-schema';
import { validateRoleUniqueness } from './role-uniqueness-validator';

export type CreateRoleParams = {
  tenantId: string;
  payload: CreateRoleInput;
};

export async function validateCreateRole(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateRoleParams>> {
  const payloadResult = createRoleSchema.safeParse(payload);

  if (!payloadResult.success) {
    return { success: false, errors: formatValidationErrors(payloadResult.error) };
  }

  const uniquenessResult = await validateRoleUniqueness({
    tenantId,
    name: payloadResult.data.name,
    code: payloadResult.data.code,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return {
    success: true,
    data: {
      tenantId,
      payload: payloadResult.data,
    },
  };
}
