import { z } from 'zod';

export const sessionIdSchema = z
  .string({ error: 'Session ID is required' })
  .trim()
  .min(1, 'Session ID is required');

export type SessionIdInput = z.infer<typeof sessionIdSchema>;

export type SessionListItem = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
};

export type SessionRow = Omit<SessionListItem, 'isCurrent'> & {
  userId: string;
};
