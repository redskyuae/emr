import type { CommandResult } from '@/app/api/lib/utils/types';
import { staffRepository } from '../repository/staff-repository';
import type { Staff } from '../schemas/staff-schema';
import { validateGetStaffById } from '../validator/get-staff-by-id-validator';

const NOT_FOUND_STATUS = 404;

export async function deactivateStaffCommand(
  userId: unknown,
  tenantId: string
): Promise<CommandResult<Staff>> {
  const validationResult = await validateGetStaffById(userId, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deactivatedStaff = await staffRepository.setStaffActive(
    validationResult.data.userId,
    validationResult.data.tenantId,
    false
  );

  if (!deactivatedStaff) {
    return {
      success: false,
      errors: ['Staff not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: deactivatedStaff };
}
