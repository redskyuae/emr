import type { CommandResult } from '@/app/api/lib/utils/types';
import { sessionRepository } from '../repository/session-repository';

export async function revokeAllSessionsCommand(
  userId: string,
  currentSessionId: string
): Promise<CommandResult<void>> {
  await sessionRepository.deleteUserSessionsExcept(userId, currentSessionId);

  return { data: undefined, success: true };
}
