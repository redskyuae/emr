import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { session as sessionTable } from '@/app/db/schema/auth';
import { createTestUser } from '@/test/helpers';
import { authRepository } from './auth-repository';

describe('Auth repository', () => {
  it('should find the Session id for a token without returning the token', async () => {
    const created = await createTestUser();
    const token = randomUUID();
    await db.insert(sessionTable).values({
      id: 'session-1',
      token,
      userId: created.id,
      expiresAt: new Date(Date.now() + 3_600_000),
    });

    await expect(authRepository.findSessionIdByToken(token)).resolves.toBe('session-1');
    await expect(authRepository.findSessionIdByToken('unknown')).resolves.toBeUndefined();
  });

  it('should find a user by email regardless of case', async () => {
    const created = await createTestUser({ name: 'Sara Ali', email: 'Sara.Ali@hospital.example' });

    await expect(authRepository.findUserByEmail('sara.ali@hospital.example')).resolves.toEqual({
      id: created.id,
      name: 'Sara Ali',
      email: 'Sara.Ali@hospital.example',
    });
    await expect(
      authRepository.findUserByEmail('nobody@hospital.example')
    ).resolves.toBeUndefined();
  });
});
