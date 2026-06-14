import { and, desc, eq, gt, ne } from 'drizzle-orm';

import { db } from '@/app/db';
import { session as sessionTable } from '@/app/db/schema/auth';
import type { SessionListItem, SessionRow } from '../schemas/session-schema';

const sessionColumns = {
  id: sessionTable.id,
  userId: sessionTable.userId,
  ipAddress: sessionTable.ipAddress,
  userAgent: sessionTable.userAgent,
  createdAt: sessionTable.createdAt,
  expiresAt: sessionTable.expiresAt,
};

function toSessionListItem(row: SessionRow, currentSessionId: string): SessionListItem {
  return {
    id: row.id,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    isCurrent: row.id === currentSessionId,
  };
}

async function getActiveSessionsByUser(userId: string, currentSessionId: string) {
  const rows = await db
    .select(sessionColumns)
    .from(sessionTable)
    .where(and(eq(sessionTable.userId, userId), gt(sessionTable.expiresAt, new Date())))
    .orderBy(desc(sessionTable.createdAt), desc(sessionTable.id));

  return rows.map((row) => toSessionListItem(row, currentSessionId));
}

async function getSessionById(sessionId: string) {
  const [session] = await db
    .select(sessionColumns)
    .from(sessionTable)
    .where(eq(sessionTable.id, sessionId))
    .limit(1);

  return session;
}

async function deleteSession(sessionId: string) {
  const [deletedSession] = await db
    .delete(sessionTable)
    .where(eq(sessionTable.id, sessionId))
    .returning(sessionColumns);

  return deletedSession;
}

async function deleteUserSessionsExcept(userId: string, currentSessionId: string) {
  return db
    .delete(sessionTable)
    .where(and(eq(sessionTable.userId, userId), ne(sessionTable.id, currentSessionId)))
    .returning(sessionColumns);
}

async function deleteUserSessions(userId: string) {
  return db.delete(sessionTable).where(eq(sessionTable.userId, userId)).returning(sessionColumns);
}

export const sessionRepository = {
  getActiveSessionsByUser,
  getSessionById,
  deleteSession,
  deleteUserSessionsExcept,
  deleteUserSessions,
};
