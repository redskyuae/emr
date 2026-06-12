import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { staffRepository } from '../repository/staff-repository';
import type { Staff } from '../schemas/staff-schema';
import { validateGetStaffById } from '../validator/get-staff-by-id-validator';

export async function reactivateStaffCommand(
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

  const reactivatedStaff = await staffRepository.setStaffActive(
    validationResult.data.userId,
    validationResult.data.tenantId,
    true
  );

  if (!reactivatedStaff) {
    return {
      success: false,
      errors: ['Staff not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: reactivatedStaff };
}
