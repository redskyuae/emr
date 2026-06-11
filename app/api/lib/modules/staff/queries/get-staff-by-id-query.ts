import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { staffRepository } from '../repository/staff-repository';
import type { Staff } from '../schemas/staff-schema';
import { validateGetStaffById } from '../validator/get-staff-by-id-validator';

export async function getStaffByIdQuery(
  userId: unknown,
  tenantId: string
): Promise<SingleQueryResult<Staff>> {
  const validationResult = await validateGetStaffById(userId, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const staff = await staffRepository.getStaffByUserId(
    validationResult.data.userId,
    validationResult.data.tenantId
  );

  if (!staff) {
    return {
      success: false,
      errors: ['Staff not found'],
      status: 404,
    };
  }

  return { success: true, data: staff };
}
