import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { tenantRepository } from '../repository/tenant-repository';
import type { Tenant } from '../schemas/tenant-schema';
import { validateUpdateTenant } from '../validator/update-tenant-validator';
import { getTenantUniqueConstraintErrors } from '../validator/tenant-uniqueness-validator';

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
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedTenant };
  } catch (error) {
    const constraintErrors = getTenantUniqueConstraintErrors(error);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
