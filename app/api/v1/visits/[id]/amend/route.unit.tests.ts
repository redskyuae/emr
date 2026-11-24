import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { amendVisitCommand } from '@/app/api/lib/modules/visit/commands/amend-visit-command';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { PUT } from './route';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';

vi.mock('@/app/api/lib/analytics/lifecycle-event-recorder', () => ({
  recordLifecycleEvent: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/modules/visit/queries/get-visit-by-id-query', () => ({
  getVisitByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/visit/commands/amend-visit-command', () => ({
  amendVisitCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const amendVisit = vi.mocked(amendVisitCommand);
const getVisitById = vi.mocked(getVisitByIdQuery);
const recordAudit = vi.mocked(recordAuditEvent);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const visit = {
  id: 1,
  visitNumber: 'VST-1001',
  status: 'COMPLETED',
  chiefComplaint: 'Fever for 3 days',
  patient: { id: 9 },
} as Visit;
const visitBefore = { ...visit, chiefComplaint: 'Fever' } as Visit;
const body = { doctorId: 3, visitTypeId: 2, chiefComplaint: 'Fever for 3 days' };

function request(rawBody = JSON.stringify(body)) {
  return new NextRequest('http://localhost/api/v1/visits/1/amend', {
    method: 'PUT',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  });
}

function context(id = '1') {
  return { params: Promise.resolve({ id }) };
}

describe('Visit amend route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    amendVisit.mockResolvedValue({ success: true, data: visit });
    getVisitById.mockResolvedValue({ success: true, data: visitBefore });
  });

  it('should return unauthorized without checking permission or amending', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(amendVisit).not.toHaveBeenCalled();
  });

  it('should return forbidden without amending when visit:amend is absent', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['visit:amend']);
    expect(amendVisit).not.toHaveBeenCalled();
  });

  it('should reject invalid JSON before amending', async () => {
    const response = await PUT(request('{'), context());

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({ message: 'Request body must be valid JSON' });
    expect(amendVisit).not.toHaveBeenCalled();
  });

  it('should pass the Visit id, active Tenant, and body to the command', async () => {
    const response = await PUT(request(), context('42'));

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toMatchObject({ data: { id: 1, status: 'COMPLETED' } });
    expect(amendVisit).toHaveBeenCalledWith('42', 'tenant-1', body);
    expect(recordLifecycleEvent).toHaveBeenCalledTimes(1);
    expect(recordLifecycleEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'visit_amended',
      expect.any(Function)
    );
  });

  it('should record a visit.amend Audit Event with the before/after', async () => {
    await PUT(request(), context('1'));

    expect(getVisitById).toHaveBeenCalledWith('1', 'tenant-1');
    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'visit.amend',
      expect.objectContaining({
        entityId: 1,
        visitId: 1,
        patientId: 9,
        entityLabel: 'VST-1001',
        changes: [
          {
            field: 'chiefComplaint',
            label: 'Chief complaint',
            from: 'Fever',
            to: 'Fever for 3 days',
          },
        ],
      })
    );
  });

  it('should not record an Audit Event when the amend fails', async () => {
    amendVisit.mockResolvedValue({ success: false, errors: ['Doctor ID is required'] });

    await PUT(request(), context());

    expect(recordAudit).not.toHaveBeenCalled();
  });

  it('should map validation failures to bad request', async () => {
    amendVisit.mockResolvedValue({ success: false, errors: ['Doctor ID is required'] });

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      message: 'Validation failed',
      errors: ['Doctor ID is required'],
    });
    expect(recordLifecycleEvent).not.toHaveBeenCalled();
  });

  it('should map a missing Visit to not found', async () => {
    amendVisit.mockResolvedValue({
      success: false,
      errors: ['Visit not found'],
      status: StatusCodes.NOT_FOUND,
    });

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    await expect(response.json()).resolves.toEqual({
      message: 'Visit not found',
      errors: ['Visit not found'],
    });
  });

  it('should surface a single conflict as the message', async () => {
    amendVisit.mockResolvedValue({
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

  it('should summarise several conflicts', async () => {
    amendVisit.mockResolvedValue({
      success: false,
      errors: ['Visit type 6 is Invalid.', 'Admit source 7 is Invalid.'],
      status: StatusCodes.CONFLICT,
    });

    const response = await PUT(request(), context());

    await expect(response.json()).resolves.toEqual({
      message: 'Conflict',
      errors: ['Visit type 6 is Invalid.', 'Admit source 7 is Invalid.'],
    });
  });

  it('should return an internal server error when the command throws', async () => {
    amendVisit.mockRejectedValue(new Error('database down'));

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    await expect(response.json()).resolves.toEqual({ message: 'Internal Server Error' });
  });
});
