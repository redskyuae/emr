import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updatePatientTreatmentPlanSessionCommand } from '@/app/api/lib/modules/patient-treatment-plan/commands/update-patient-treatment-plan-session-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { PATCH } from './route';

vi.mock(
  '@/app/api/lib/modules/patient-treatment-plan/commands/update-patient-treatment-plan-session-command',
  () => ({ updatePatientTreatmentPlanSessionCommand: vi.fn() })
);
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const updateSession = vi.mocked(updatePatientTreatmentPlanSessionCommand);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);
const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const plan = { id: 44, sessions: [{ id: 102, warning: 'Avoid the left knee.' }] };

function request(body = JSON.stringify({ warning: 'Avoid the left knee.' })) {
  return new NextRequest('http://localhost/api/v1/patients/12/treatment-plans/44/sessions/102', {
    method: 'PATCH',
    body,
    headers: { 'Content-Type': 'application/json' },
  });
}

function context() {
  return {
    params: Promise.resolve({ id: '12', planId: '44', sessionId: '102' }),
  } as RouteContext<'/api/v1/patients/[id]/treatment-plans/[planId]/sessions/[sessionId]'>;
}

describe('Patient Treatment Plan Session route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    updateSession.mockResolvedValue({ success: true, data: plan as never });
  });

  it('should return unauthorized without checking permission or updating', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await PATCH(request(), context());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(updateSession).not.toHaveBeenCalled();
  });

  it('should require read and update permissions before updating', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await PATCH(request(), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, [
      'patient-treatment-plan:read',
      'patient-treatment-plan:update',
    ]);
    expect(updateSession).not.toHaveBeenCalled();
  });

  it('should reject invalid JSON before updating', async () => {
    const response = await PATCH(request('{'), context());

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({ message: 'Request body must be valid JSON' });
    expect(updateSession).not.toHaveBeenCalled();
  });

  it('should pass the path IDs and active Tenant and return the updated Plan', async () => {
    const response = await PATCH(request(), context());

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toEqual({ data: plan });
    expect(updateSession).toHaveBeenCalledWith(
      {
        patientId: '12',
        tenantId: 'tenant-1',
        patientTreatmentPlanId: '44',
        patientTreatmentPlanSessionId: '102',
      },
      { warning: 'Avoid the left knee.' }
    );
  });

  it.each([
    [StatusCodes.BAD_REQUEST, 'Validation failed', 'Procedure cannot be empty'],
    [
      StatusCodes.NOT_FOUND,
      'Patient Treatment Plan Session not found',
      'Patient Treatment Plan Session not found',
    ],
    [StatusCodes.CONFLICT, 'Conflict', 'Session 2 is already completed.'],
  ])('should map a %s command failure to its message', async (status, message, error) => {
    updateSession.mockResolvedValue({
      success: false,
      status: status === StatusCodes.BAD_REQUEST ? undefined : status,
      errors: [error],
    });

    const response = await PATCH(request(), context());

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ message, errors: [error] });
  });

  it('should return an internal server error when the command throws', async () => {
    updateSession.mockRejectedValue(new Error('boom'));

    const response = await PATCH(request(), context());

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
