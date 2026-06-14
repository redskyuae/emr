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
    return { success: false, errors: formatValidationErrors(userIdResult.error) };
  }

  const staff = await staffRepository.getStaffByUserId(userIdResult.data, tenantId);

  if (!staff) {
    return {
      success: false,
      errors: ['Staff not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  await sessionRepository.deleteUserSessions(userIdResult.data);

  return { success: true, data: undefined };
}
