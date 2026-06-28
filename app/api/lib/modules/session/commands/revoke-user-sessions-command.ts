import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { staffRepository } from '../../staff/repository/staff-repository';
import { staffUserIdSchema } from '../../staff/schemas/staff-schema';
import { sessionRepository } from '../repository/session-repository';

export async function revokeUserSessionsCommand(
  userId: unknown,
  tenantId: string
): Promise<CommandResult<void>> {
  const userIdResult = staffUserIdSchema.safeParse(userId);

  if (!userIdResult.success) {
    return { errors: formatValidationErrors(userIdResult.error), success: false };
  }

  const staff = await staffRepository.getStaffByUserId(userIdResult.data, tenantId);

  if (!staff) {
    return {
      errors: ['Staff not found'],
      status: StatusCodes.NOT_FOUND,
      success: false,
    };
  }

  await sessionRepository.deleteUserSessions(userIdResult.data);

  return { data: undefined, success: true };
}
