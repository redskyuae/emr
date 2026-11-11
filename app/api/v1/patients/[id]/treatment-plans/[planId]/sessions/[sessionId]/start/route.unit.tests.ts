import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { startPatientTreatmentPlanSessionCommand } from '@/app/api/lib/modules/patient-treatment-plan/commands/start-patient-treatment-plan-session-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { POST } from './route';

vi.mock(
  '@/app/api/lib/modules/patient-treatment-plan/commands/start-patient-treatment-plan-session-command',
  () => ({ startPatientTreatmentPlanSessionCommand: vi.fn() })
);
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const startSession = vi.mocked(startPatientTreatmentPlanSessionCommand);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);
const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const plan = { id: 44, sessions: [{ id: 102, startedVisitId: 5120 }] };

function request(body = JSON.stringify({ visitId: 5120 })) {
  return new NextRequest(
    'http://localhost/api/v1/patients/12/treatment-plans/44/sessions/102/start',
    { method: 'POST', body, headers: { 'Content-Type': 'application/json' } }
  );
}

function context() {
  return {
    params: Promise.resolve({ id: '12', planId: '44', sessionId: '102' }),
  } as RouteContext<'/api/v1/patients/[id]/treatment-plans/[planId]/sessions/[sessionId]/start'>;
}

describe('Start Patient Treatment Plan Session route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    startSession.mockResolvedValue({ success: true, data: plan as never });
  });

  it('should return unauthorized without checking permission or starting', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await POST(request(), context());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(startSession).not.toHaveBeenCalled();
  });

  it('should require read and start permissions before starting', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await POST(request(), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, [
      'patient-treatment-plan:read',
      'patient-treatment-plan:start',
    ]);
    expect(startSession).not.toHaveBeenCalled();
  });

  it('should reject invalid JSON before starting', async () => {
    const response = await POST(request('not json'), context());

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({ message: 'Request body must be valid JSON' });
    expect(startSession).not.toHaveBeenCalled();
  });

  it('should pass the path IDs and active Tenant and return the started Plan', async () => {
    const response = await POST(request(), context());

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toEqual({ data: plan });
    expect(startSession).toHaveBeenCalledWith(
      {
        patientId: '12',
        tenantId: 'tenant-1',
        patientTreatmentPlanId: '44',
        patientTreatmentPlanSessionId: '102',
      },
      { visitId: 5120 }
    );
  });

  it.each([
    [StatusCodes.NOT_FOUND, 'Visit not found', 'Visit not found'],
    [StatusCodes.CONFLICT, 'Conflict', 'Session 2 is already in progress.'],
  ])('should map a %s command failure to its message', async (status, message, error) => {
    startSession.mockResolvedValue({ success: false, status, errors: [error] });

    const response = await POST(request(), context());

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ message, errors: [error] });
  });
});
