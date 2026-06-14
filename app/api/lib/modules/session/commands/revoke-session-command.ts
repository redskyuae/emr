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
    return { success: false, errors: formatValidationErrors(sessionIdResult.error) };
  }

  if (sessionIdResult.data === currentSessionId) {
    return {
      success: false,
      errors: [CANNOT_REVOKE_CURRENT_SESSION_MESSAGE],
      status: StatusCodes.UNPROCESSABLE_ENTITY,
    };
  }

  const existingSession = await sessionRepository.getSessionById(sessionIdResult.data);

  if (!existingSession) {
    return {
      success: false,
      errors: ['Session not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  if (existingSession.userId !== callerUserId) {
    return {
      success: false,
      errors: ['Forbidden'],
      status: StatusCodes.FORBIDDEN,
    };
  }

  const deletedSession = await sessionRepository.deleteSession(sessionIdResult.data);

  if (!deletedSession) {
    return {
      success: false,
      errors: ['Session not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedSession };
}
