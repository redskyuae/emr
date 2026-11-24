import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEventCommand } from '@/app/api/lib/modules/audit-log/commands/record-audit-event-command';
import type { TenantSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent, recordAuditEventFor } from './audit-recorder';

vi.mock('@/app/api/lib/modules/audit-log/commands/record-audit-event-command', () => ({
  recordAuditEventCommand: vi.fn(),
}));

const command = vi.mocked(recordAuditEventCommand);

function tenantSession(session: Record<string, unknown> = {}): TenantSession {
  return {
    tenantId: 'tenant-1',
    session: {
      user: { id: 'user-1', name: 'Dr. Sara Ali', email: 'sara.ali@hospital.example' },
      session: { id: 'session-1', ...session },
    },
  } as unknown as TenantSession;
}

const request = new Request('http://localhost/api/v1/visits/12', {
  headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1', 'user-agent': 'Mozilla/5.0' },
});

describe('recordAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    command.mockResolvedValue({ success: true, data: {} as never });
  });

  it('should take the actor from the Session and the context from the request', async () => {
    await recordAuditEvent(tenantSession(), request, 'visit.view', { visitId: 12, patientId: 7 });

    expect(command).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'visit.view',
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        actorName: 'Dr. Sara Ali',
        actorEmail: 'sara.ali@hospital.example',
        ipAddress: '203.0.113.7',
        userAgent: 'Mozilla/5.0',
        visitId: 12,
        patientId: 7,
        sessionId: 'session-1',
      })
    );
  });

  it('should record an actor without a Session, such as at sign-in', async () => {
    await recordAuditEventFor(
      { tenantId: 'tenant-1', userId: 'user-1', name: ' ', email: 'sara.ali@hospital.example' },
      request,
      'auth.sign-in-failed',
      { outcome: 'failed', reason: 'Invalid email or password' }
    );

    expect(command).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.sign-in-failed',
        outcome: 'failed',
        sessionId: null,
        actorName: 'sara.ali@hospital.example',
        ipAddress: '203.0.113.7',
      })
    );
  });

  it('should record the operator of an impersonated Session', async () => {
    await recordAuditEvent(tenantSession({ impersonatedBy: 'support-9' }), request, 'patient.view');

    expect(command).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { impersonatedBy: 'support-9' } })
    );
  });

  it('should never throw when recording fails', async () => {
    command.mockRejectedValue(new Error('database down'));

    await expect(recordAuditEvent(tenantSession(), request, 'visit.view')).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it('should resolve lazy details before recording them', async () => {
    await recordAuditEvent(tenantSession(), request, 'visit-document.add', async () => ({
      visitId: 12,
      patientId: 7,
    }));

    expect(command).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'visit-document.add', visitId: 12, patientId: 7 })
    );
  });

  it('should skip the event without throwing when a lazy detail lookup fails', async () => {
    const lookup = vi.fn().mockRejectedValue(new Error('database down'));

    await expect(
      recordAuditEvent(tenantSession(), request, 'visit-document.add', lookup)
    ).resolves.toBeUndefined();
    expect(lookup).toHaveBeenCalled();
    expect(command).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('should log a rejected event instead of throwing', async () => {
    command.mockResolvedValue({ success: false, errors: ['Audit action is Invalid.'] });

    await expect(recordAuditEvent(tenantSession(), request, 'visit.view')).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith('Audit Event was not recorded', 'visit.view', [
      'Audit action is Invalid.',
    ]);
  });
});
