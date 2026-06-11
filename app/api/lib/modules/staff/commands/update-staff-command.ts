import type { CommandResult } from '@/app/api/lib/utils/types';
import { staffRepository } from '../repository/staff-repository';
import type { Staff } from '../schemas/staff-schema';
import { getStaffUniqueConstraintErrors } from '../validator/staff-uniqueness-validator';
import { validateUpdateStaff } from '../validator/update-staff-validator';

const CONFLICT_STATUS = 409;
const NOT_FOUND_STATUS = 404;

export async function updateStaffCommand(
  userId: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Staff>> {
  const validationResult = await validateUpdateStaff(userId, tenantId, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const updatedStaff = await staffRepository.updateStaff(
      validationResult.data.userId,
      validationResult.data.tenantId,
      validationResult.data.payload
    );

    if (!updatedStaff) {
      return {
        success: false,
        errors: ['Staff not found'],
        status: NOT_FOUND_STATUS,
      };
    }

    return { success: true, data: updatedStaff };
  } catch (error) {
    const constraintErrors = getStaffUniqueConstraintErrors(error, {
      staffCode: validationResult.data.payload.staffCode,
    });

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: CONFLICT_STATUS };
    }

    throw error;
  }
}
