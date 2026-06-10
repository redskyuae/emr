import type { CommandResult } from '@/app/api/lib/utils/types';
import { tenantRepository } from '../repository/tenant-repository';
import type { Tenant } from '../schemas/tenant-schema';
import { validateUpdateTenant } from '../validator/update-tenant-validator';
import { getTenantUniqueConstraintErrors } from '../validator/tenant-uniqueness-validator';

const CONFLICT_STATUS = 409;
const NOT_FOUND_STATUS = 404;

export async function updateTenantCommand(
  id: unknown,
  payload: unknown,
  userId: string
): Promise<CommandResult<Tenant>> {
  const validationResult = await validateUpdateTenant(id, payload, userId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const updatedTenant = await tenantRepository.updateTenant(
      validationResult.data.id,
      validationResult.data.payload
    );

    if (!updatedTenant) {
      return {
        success: false,
        errors: ['Tenant not found'],
        status: NOT_FOUND_STATUS,
      };
    }

    return { success: true, data: updatedTenant };
  } catch (error) {
    const constraintErrors = getTenantUniqueConstraintErrors(error);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: CONFLICT_STATUS };
    }

    throw error;
  }
}
