import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { amendVisitDiagnosesCommand } from '@/app/api/lib/modules/visit-diagnosis/commands/amend-visit-diagnoses-command';
import type { VisitDiagnosis } from '@/app/api/lib/modules/visit-diagnosis/schemas/visit-diagnosis-schema';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { listVisitDiagnosesQuery } from '@/app/api/lib/modules/visit-diagnosis/queries/list-visit-diagnoses-query';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { PUT } from './route';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';

vi.mock('@/app/api/lib/analytics/lifecycle-event-recorder', () => ({
  recordLifecycleEvent: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/visit-diagnosis/commands/amend-visit-diagnoses-command', () => ({
  amendVisitDiagnosesCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/modules/visit-diagnosis/queries/list-visit-diagnoses-query', () => ({
  listVisitDiagnosesQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/visit/queries/get-visit-by-id-query', () => ({
  getVisitByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const amendDiagnoses = vi.mocked(amendVisitDiagnosesCommand);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);
const getVisitById = vi.mocked(getVisitByIdQuery);
const recordAudit = vi.mocked(recordAuditEvent);
const listDiagnoses = vi.mocked(listVisitDiagnosesQuery);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const diagnosis = { id: 1, visitId: 42, code: 'AYU-AMV' } as VisitDiagnosis;
const body = {
  diagnoses: [{ codeSystem: 'AYURVEDA', ayurvedaDiagnosisCodeId: 3, diagnosisType: 'PRINCIPAL' }],
};

function request(rawBody = JSON.stringify(body)) {
  return new NextRequest('http://localhost/api/v1/visits/42/diagnoses/amend', {
    method: 'PUT',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  });
}

function context(id = '42') {
  return { params: Promise.resolve({ id }) };
}

function recordedProperties() {
  const [, , , buildProperties] = vi.mocked(recordLifecycleEvent).mock.calls[0];
  return buildProperties();
}

/** The details the route handed the recorder, resolving a lazy lookup as the recorder does. */
async function recordedDetails() {
  const details = recordAudit.mock.calls[0]?.[3];

  return typeof details === 'function' ? await details() : details;
}

describe('Visit diagnoses amend route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    amendDiagnoses.mockResolvedValue({
      success: true,
      data: [diagnosis],
      visitCompletedAt: new Date('2026-07-15T11:00:00.000Z'),
    });
    getVisitById.mockResolvedValue({
      success: true,
      data: { id: 42, visitNumber: 'VST-1042', patient: { id: 9 } } as never,
    });
    listDiagnoses.mockResolvedValue({ success: true, data: [], total: 0 });
  });

  it('should return unauthorized without checking permission or amending', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(amendDiagnoses).not.toHaveBeenCalled();
  });

  it('should return forbidden without amending when visit:amend is absent', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['visit:amend']);
    expect(amendDiagnoses).not.toHaveBeenCalled();
  });

  it('should reject invalid JSON before amending', async () => {
    const response = await PUT(request('{'), context());

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({ message: 'Request body must be valid JSON' });
    expect(amendDiagnoses).not.toHaveBeenCalled();
  });

  it('should pass the Visit id, active Tenant, and body to the command', async () => {
    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toEqual({ data: [diagnosis] });
    expect(amendDiagnoses).toHaveBeenCalledWith('42', 'tenant-1', body);
    expect(recordLifecycleEvent).toHaveBeenCalledTimes(1);
    expect(recordLifecycleEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'visit_amended',
      expect.any(Function)
    );
    expect(recordedProperties()).toMatchObject({ amended_part: 'diagnoses' });
  });

  it('should record a visit-diagnosis.amend Audit Event with the codes added', async () => {
    await PUT(request(), context('42'));

    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'visit-diagnosis.amend',
      expect.any(Function)
    );
    await expect(recordedDetails()).resolves.toMatchObject({
      visitId: 42,
      patientId: 9,
      metadata: { added: ['AYU-AMV'], removed: [] },
    });
  });

  it('should answer without waiting on the Visit lookup that only serves the Audit Event', async () => {
    getVisitById.mockRejectedValue(new Error('database down'));

    const response = await PUT(request(), context('42'));

    expect(response.status).toBe(StatusCodes.OK);
    expect(getVisitById).not.toHaveBeenCalled();
  });

  it('should surface a not-completed Visit as a conflict message', async () => {
    amendDiagnoses.mockResolvedValue({
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

  it('should map a missing Visit to not found', async () => {
    amendDiagnoses.mockResolvedValue({
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

  it('should map validation failures to bad request', async () => {
    amendDiagnoses.mockResolvedValue({
      success: false,
      errors: ['Diagnosis code M06.9 is listed more than once.'],
    });

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toMatchObject({ message: 'Validation failed' });
    expect(recordLifecycleEvent).not.toHaveBeenCalled();
  });

  it('should return an internal server error when the command throws', async () => {
    amendDiagnoses.mockRejectedValue(new Error('database down'));

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    await expect(response.json()).resolves.toEqual({ message: 'Internal Server Error' });
  });
});
