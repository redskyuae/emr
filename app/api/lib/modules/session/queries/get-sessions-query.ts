import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { sessionRepository } from '../repository/session-repository';
import type { SessionListItem } from '../schemas/session-schema';

export async function getSessionsQuery(
  userId: string,
  currentSessionId: string
): Promise<ListQueryResult<SessionListItem>> {
  const sessions = await sessionRepository.getActiveSessionsByUser(userId, currentSessionId);

  return { data: sessions, total: sessions.length, success: true };
}
