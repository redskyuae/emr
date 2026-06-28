import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { sessionRepository } from '../repository/session-repository';
import { sessionIdSchema, type SessionRow } from '../schemas/session-schema';

export const CANNOT_REVOKE_CURRENT_SESSION_MESSAGE =
  'Cannot revoke the current session. Use sign-out instead.';

export async function revokeSessionCommand(
  sessionId: unknown,
  callerUserId: string,
  currentSessionId: string
): Promise<CommandResult<SessionRow>> {
  const sessionIdResult = sessionIdSchema.safeParse(sessionId);

  if (!sessionIdResult.success) {
    return { errors: formatValidationErrors(sessionIdResult.error), success: false };
  }

  if (sessionIdResult.data === currentSessionId) {
    return {
      errors: [CANNOT_REVOKE_CURRENT_SESSION_MESSAGE],
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      success: false,
    };
  }

  const existingSession = await sessionRepository.getSessionById(sessionIdResult.data);

  if (!existingSession) {
    return {
      errors: ['Session not found'],
      status: StatusCodes.NOT_FOUND,
      success: false,
    };
  }

  if (existingSession.userId !== callerUserId) {
    return {
      errors: ['Forbidden'],
      status: StatusCodes.FORBIDDEN,
      success: false,
    };
  }

  const deletedSession = await sessionRepository.deleteSession(sessionIdResult.data);

  if (!deletedSession) {
    return {
      errors: ['Session not found'],
      status: StatusCodes.NOT_FOUND,
      success: false,
    };
  }

  return { data: deletedSession, success: true };
}
