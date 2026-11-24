import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getActorRoleNamesQuery } from '../queries/get-actor-role-names-query';
import { auditLogRepository } from '../repository/audit-log-repository';
import type { AuditEvent } from '../schemas/audit-log-schema';
import { validateRecordAuditEvent } from '../validator/record-audit-event-validator';
import { recordAuditEventCommand } from './record-audit-event-command';

vi.mock('../repository/audit-log-repository', () => ({
  auditLogRepository: { recordAuditEvent: vi.fn() },
}));
vi.mock('../queries/get-actor-role-names-query', () => ({
  getActorRoleNamesQuery: vi.fn(),
}));
vi.mock('../validator/record-audit-event-validator', () => ({
  validateRecordAuditEvent: vi.fn(),
}));

const repo = vi.mocked(auditLogRepository);
const validate = vi.mocked(validateRecordAuditEvent);
const roleNames = vi.mocked(getActorRoleNamesQuery);

const validated = {
  tenantId: 'tenant-1',
  action: 'visit.view' as const,
  actorUserId: 'user-1',
  actorName: 'Dr. Sara Ali',
  category: 'access' as const,
  entityType: 'visit' as const,
};

const recorded: AuditEvent = {
  id: 1,
  tenantId: 'tenant-1',
  occurredOn: new Date('2026-11-22T06:00:00Z'),
  actorUserId: 'user-1',
  actorName: 'Dr. Sara Ali',
  actorEmail: null,
  actorRoles: 'Doctor',
  sessionId: null,
  action: 'visit.view',
  module: 'Visits',
  operation: 'View',
  category: 'access',
  outcome: 'success',
  entityType: 'visit',
  entityId: '12',
  entityLabel: null,
  patientId: 7,
  visitId: 12,
  reason: null,
  changes: null,
  metadata: null,
  ipAddress: null,
  userAgent: null,
};

describe('Audit Log commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validate.mockReturnValue({ success: true, data: validated });
    repo.recordAuditEvent.mockResolvedValue(recorded);
    roleNames.mockResolvedValue('Doctor');
  });

  it('should validate first and not write when validation fails', async () => {
    validate.mockReturnValue({ success: false, errors: ['Audit action is Invalid.'] });

    await expect(recordAuditEventCommand({})).resolves.toEqual({
      success: false,
      errors: ['Audit action is Invalid.'],
    });
    expect(repo.recordAuditEvent).not.toHaveBeenCalled();
    expect(roleNames).not.toHaveBeenCalled();
  });

  it('should write the validated event and return it', async () => {
    await expect(recordAuditEventCommand({ any: 'input' })).resolves.toEqual({
      success: true,
      data: recorded,
    });
    expect(validate).toHaveBeenCalledWith({ any: 'input' });
    expect(repo.recordAuditEvent).toHaveBeenCalledWith({ ...validated, actorRoles: 'Doctor' });
  });

  it('should snapshot the actor Roles at the time of the event', async () => {
    roleNames.mockResolvedValue('Tenant Owner, Doctor');
    await recordAuditEventCommand({});

    expect(roleNames).toHaveBeenCalledWith('user-1', 'tenant-1');
    expect(repo.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ actorRoles: 'Tenant Owner, Doctor' })
    );
  });

  it('should not look up Roles for a system actor', async () => {
    validate.mockReturnValue({ success: true, data: { ...validated, actorUserId: null } });
    await recordAuditEventCommand({});

    expect(roleNames).not.toHaveBeenCalled();
    expect(repo.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ actorRoles: null })
    );
  });

  it('should rethrow repository errors', async () => {
    const error = new Error('database down');
    repo.recordAuditEvent.mockRejectedValue(error);

    await expect(recordAuditEventCommand({})).rejects.toThrow(error);
  });
});
