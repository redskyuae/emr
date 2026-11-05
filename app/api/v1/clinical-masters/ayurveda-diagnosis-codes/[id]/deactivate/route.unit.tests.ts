import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deactivateAyurvedaDiagnosisCodeCommand } from '@/app/api/lib/modules/ayurveda-diagnosis-code/commands/deactivate-ayurveda-diagnosis-code-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { POST } from './route';

vi.mock(
  '@/app/api/lib/modules/ayurveda-diagnosis-code/commands/deactivate-ayurveda-diagnosis-code-command',
  () => ({
    deactivateAyurvedaDiagnosisCodeCommand: vi.fn(),
  })
);
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantSession: vi.fn(),
  requireTenantPermissions: vi.fn(),
}));

const command = vi.mocked(deactivateAyurvedaDiagnosisCodeCommand);
const requireSession = vi.mocked(requireTenantSession);
const requirePermissions = vi.mocked(requireTenantPermissions);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const ayurvedaDiagnosisCode = { id: 1, code: 'AYU-JVARA', title: 'Jvara (Fever)' };

function post(id = '1') {
  return POST(
    new NextRequest(
      `http://localhost/api/v1/clinical-masters/ayurveda-diagnosis-codes/${id}/deactivate`,
      {
        method: 'POST',
      }
    ),
    { params: Promise.resolve({ id }) }
  );
}

describe('Deactivate Ayurveda Diagnosis Code route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    command.mockResolvedValue({ success: true, data: ayurvedaDiagnosisCode as never });
  });

  it('should return the session response when the session is missing', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED }) as never
    );

    const response = await post();

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(command).not.toHaveBeenCalled();
  });

  it('should require the update permission before running the command', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await post();

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, [
      'ayurveda-diagnosis-code:update',
    ]);
    expect(command).not.toHaveBeenCalled();
  });

  it('should return the updated Ayurveda diagnosis code', async () => {
    const response = await post();

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toEqual({ data: ayurvedaDiagnosisCode });
    expect(command).toHaveBeenCalledWith('1', 'tenant-1');
  });

  it('should map not-found failures to 404', async () => {
    command.mockResolvedValue({
      success: false,
      errors: ['Ayurveda diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    });

    const response = await post();

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    await expect(response.json()).resolves.toMatchObject({
      message: 'Ayurveda diagnosis code not found',
    });
  });

  it('should map validation failures to 400', async () => {
    command.mockResolvedValue({
      success: false,
      errors: ['Ayurveda diagnosis code abc is Invalid.'],
    });

    const response = await post('abc');

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      message: 'Validation failed',
      errors: ['Ayurveda diagnosis code abc is Invalid.'],
    });
  });

  it('should return 500 when the command throws', async () => {
    command.mockRejectedValue(new Error('database down'));

    const response = await post();

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
