import { StatusCodes } from 'http-status-codes';

import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { staffRepository } from '../../staff/repository/staff-repository';
import { staffUserIdSchema } from '../../staff/schemas/staff-schema';
import { sessionRepository } from '../repository/session-repository';
import type { SessionListItem } from '../schemas/session-schema';

export async function getUserSessionsQuery(
  userId: unknown,
  tenantId: string,
  currentSessionId: string
): Promise<ListQueryResult<SessionListItem>> {
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

  const sessions = await sessionRepository.getActiveSessionsByUser(
    userIdResult.data,
    currentSessionId
  );

  return { data: sessions, total: sessions.length, success: true };
}
