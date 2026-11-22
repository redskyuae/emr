import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { amendVisitVitalSignCommand } from '@/app/api/lib/modules/patient-vital-sign/commands/amend-visit-vital-sign-command';
import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getPatientVitalSignByIdQuery } from '@/app/api/lib/modules/patient-vital-sign/queries/get-patient-vital-sign-by-id-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { PUT } from './route';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';

vi.mock('@/app/api/lib/analytics/lifecycle-event-recorder', () => ({
  recordLifecycleEvent: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/patient-vital-sign/commands/amend-visit-vital-sign-command', () => ({
  amendVisitVitalSignCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock(
  '@/app/api/lib/modules/patient-vital-sign/queries/get-patient-vital-sign-by-id-query',
  () => ({ getPatientVitalSignByIdQuery: vi.fn() })
);
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const amendVital = vi.mocked(amendVisitVitalSignCommand);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);
const getBefore = vi.mocked(getPatientVitalSignByIdQuery);
const recordAudit = vi.mocked(recordAuditEvent);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const reading = { id: 4, visitId: 1, patientId: 9, pulseBpm: 72 } as PatientVitalSign;
const body = { pulseBpm: 72, notes: 'Rechecked after rest' };

function request(rawBody = JSON.stringify(body)) {
  return new NextRequest('http://localhost/api/v1/visits/1/vitals/4/amend', {
    method: 'PUT',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  });
}

function context(id = '1', vitalId = '4') {
  return { params: Promise.resolve({ id, vitalId }) };
}

function recordedProperties() {
  const [, , , buildProperties] = vi.mocked(recordLifecycleEvent).mock.calls[0];
  return buildProperties();
}

describe('Visit Vital Sign amend route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    amendVital.mockResolvedValue({
      success: true,
      data: reading,
      visitCompletedAt: new Date('2026-07-15T11:00:00.000Z'),
    });

    getBefore.mockResolvedValue({ success: true, data: { ...reading, pulseBpm: 80 } });
  });

  it('should return unauthorized without checking permission or amending', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(amendVital).not.toHaveBeenCalled();
  });

  it('should return forbidden without amending when visit:amend is absent', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['visit:amend']);
    expect(amendVital).not.toHaveBeenCalled();
  });

  it('should reject invalid JSON before amending', async () => {
    const response = await PUT(request('{'), context());

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({ message: 'Request body must be valid JSON' });
    expect(amendVital).not.toHaveBeenCalled();
  });

  it('should pass the Visit id, Vital Sign id, active Tenant, and body to the command', async () => {
    const response = await PUT(request(), context('7', '9'));

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toMatchObject({ data: { id: 4, pulseBpm: 72 } });
    expect(amendVital).toHaveBeenCalledWith('7', '9', 'tenant-1', body);
    expect(recordLifecycleEvent).toHaveBeenCalledTimes(1);
    expect(recordLifecycleEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'visit_amended',
      expect.any(Function)
    );
    expect(recordedProperties()).toMatchObject({ amended_part: 'vital_sign' });
  });

  it('should record a vital-sign.amend Audit Event with the before/after', async () => {
    await PUT(request(), context());

    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'vital-sign.amend',
      expect.objectContaining({
        entityId: 4,
        visitId: 1,
        patientId: 9,
        changes: [{ field: 'pulseBpm', label: 'Pulse (bpm)', from: 80, to: 72 }],
      })
    );
  });

  it('should not record an Audit Event when the amend fails', async () => {
    amendVital.mockResolvedValue({ success: false, errors: ['Invalid'] });

    await PUT(request(), context());

    expect(recordAudit).not.toHaveBeenCalled();
  });

  it('should map validation failures to bad request', async () => {
    amendVital.mockResolvedValue({
      success: false,
      errors: ['At least one vital sign measurement is required'],
      status: StatusCodes.BAD_REQUEST,
    });

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      message: 'Validation failed',
      errors: ['At least one vital sign measurement is required'],
    });
    expect(recordLifecycleEvent).not.toHaveBeenCalled();
  });

  it.each(['Visit not found', 'Vital sign not found'])(
    'should map %s to not found with that message',
    async (error) => {
      amendVital.mockResolvedValue({
        success: false,
        errors: [error],
        status: StatusCodes.NOT_FOUND,
      });

      const response = await PUT(request(), context());

      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      await expect(response.json()).resolves.toEqual({ message: error, errors: [error] });
    }
  );

  it('should map a Visit that is not Completed to conflict', async () => {
    amendVital.mockResolvedValue({
      success: false,
      errors: ['Visit VST-1001 is not completed and cannot be amended.'],
      status: StatusCodes.CONFLICT,
    });

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.CONFLICT);
    await expect(response.json()).resolves.toEqual({
      message: 'Visit VST-1001 is not completed and cannot be amended.',
      errors: ['Visit VST-1001 is not completed and cannot be amended.'],
    });
  });

  it('should return an internal server error when the command throws', async () => {
    amendVital.mockRejectedValue(new Error('database down'));

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
