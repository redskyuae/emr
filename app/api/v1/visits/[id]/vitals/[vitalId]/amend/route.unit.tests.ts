import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { amendVisitVitalSignCommand } from '@/app/api/lib/modules/patient-vital-sign/commands/amend-visit-vital-sign-command';
import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { PUT } from './route';

vi.mock('@/app/api/lib/modules/patient-vital-sign/commands/amend-visit-vital-sign-command', () => ({
  amendVisitVitalSignCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const amendVital = vi.mocked(amendVisitVitalSignCommand);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const reading = { id: 4, visitId: 1, pulseBpm: 72 } as PatientVitalSign;
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

describe('Visit Vital Sign amend route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    amendVital.mockResolvedValue({ success: true, data: reading });
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
