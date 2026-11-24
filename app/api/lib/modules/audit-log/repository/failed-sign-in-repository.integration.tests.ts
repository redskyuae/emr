import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { auditEvent as auditEventTable } from '@/app/db/schema/audit-event';
import { failedSignInRepository } from './failed-sign-in-repository';

const tenantA = 'tenant-a-failed-sign-in-test';
const tenantB = 'tenant-b-failed-sign-in-test';
const since = new Date('2026-11-24T09:45:00.000Z');

function event(
  overrides: { tenantId?: string; userId?: string; action?: string; occurredOn?: string } = {}
) {
  const action = overrides.action ?? 'auth.sign-in-failed';

  return {
    action,
    category: 'auth',
    entityType: 'session',
    tenantId: overrides.tenantId ?? tenantA,
    actorName: 'Dr. Sara Ali',
    occurredOn: new Date(overrides.occurredOn ?? '2026-11-24T09:50:00.000Z'),
    actorUserId: overrides.userId ?? 'user-1',
    actorEmail: 'sara.ali@hospital.example',
  };
}

describe('Failed sign-in repository', () => {
  it('should count only that user’s failed sign-ins in that Tenant since the instant', async () => {
    await db
      .insert(auditEventTable)
      .values([
        event(),
        event({ occurredOn: '2026-11-24T09:45:00.000Z' }),
        event({ occurredOn: '2026-11-24T09:44:59.000Z' }),
        event({ action: 'auth.sign-in' }),
        event({ userId: 'user-2' }),
        event({ tenantId: tenantB }),
      ]);

    await expect(
      failedSignInRepository.countFailedSignInsSince(tenantA, 'user-1', since)
    ).resolves.toBe(2);
  });

  it('should return zero when nothing was recorded', async () => {
    await expect(
      failedSignInRepository.countFailedSignInsSince(tenantA, 'user-1', since)
    ).resolves.toBe(0);
  });
});
