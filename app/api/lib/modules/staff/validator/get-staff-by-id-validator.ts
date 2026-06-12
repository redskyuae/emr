import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { staffRepository } from '../repository/staff-repository';
import { staffUserIdSchema } from '../schemas/staff-schema';

export type StaffByIdParams = {
  userId: string;
  tenantId: string;
};

export async function validateGetStaffById(
  userId: unknown,
  tenantId: string
): Promise<ValidationResult<StaffByIdParams>> {
  const idResult = staffUserIdSchema.safeParse(userId);

  if (!idResult.success) {
    return { success: false, errors: formatValidationErrors(idResult.error) };
  }

  const existingStaff = await staffRepository.getStaffByUserId(idResult.data, tenantId);

  if (!existingStaff) {
    return {
      success: false,
      errors: ['Staff not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return {
    success: true,
    data: {
      userId: idResult.data,
      tenantId,
    },
  };
}
