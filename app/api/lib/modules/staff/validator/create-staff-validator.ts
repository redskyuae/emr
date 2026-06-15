import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  uniqueRoleIds,
  validateActiveRoles,
} from '../../user-role/validator/user-role-validator-utils';
import { createStaffSchema, type CreateStaffInput } from '../schemas/staff-schema';
import { validateStaffUniqueness } from './staff-uniqueness-validator';

export async function validateCreateStaff(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateStaffInput>> {
  const result = createStaffSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateStaffUniqueness({
    tenantId,
    email: result.data.email,
    staffCode: result.data.staffCode,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  const roleIds = uniqueRoleIds(result.data.roleIds);
  const rolesResult = await validateActiveRoles(roleIds, tenantId);

  if (!rolesResult.success) {
    return {
      success: false,
      errors: rolesResult.errors,
      status: rolesResult.status,
    };
  }

  return {
    success: true,
    data: {
      ...result.data,
      roleIds: rolesResult.data.map((role) => role.id),
    },
  };
}
