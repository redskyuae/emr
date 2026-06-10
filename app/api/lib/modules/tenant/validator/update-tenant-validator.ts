import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { updateTenantSchema, type UpdateTenantInput } from '../schemas/tenant-schema';
import { validateTenantOwnerAccess } from './tenant-access-validator';
import { validateTenantUniqueness } from './tenant-uniqueness-validator';

type UpdateTenantValidation = {
  id: string;
  payload: UpdateTenantInput;
};

export async function validateUpdateTenant(
  id: unknown,
  payload: unknown,
  userId: string
): Promise<ValidationResult<UpdateTenantValidation>> {
  const accessResult = await validateTenantOwnerAccess(id, userId);
  const payloadResult = updateTenantSchema.safeParse(payload);

  if (!accessResult.success) {
    return {
      success: false,
      errors: accessResult.errors,
      status: accessResult.status,
    };
  }

  if (!payloadResult.success) {
    return { success: false, errors: formatValidationErrors(payloadResult.error) };
  }

  const uniquenessResult = await validateTenantUniqueness({
    name: payloadResult.data.name,
    excludeId: accessResult.data.id,
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
      id: accessResult.data.id,
      payload: payloadResult.data,
    },
  };
}
