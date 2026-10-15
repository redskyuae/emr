import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assignPatientTreatmentPlanCommand } from '@/app/api/lib/modules/patient-treatment-plan/commands/assign-patient-treatment-plan-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { POST } from './route';

vi.mock(
  '@/app/api/lib/modules/patient-treatment-plan/commands/assign-patient-treatment-plan-command',
  () => ({
    assignPatientTreatmentPlanCommand: vi.fn(),
  })
);
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const command = vi.mocked(assignPatientTreatmentPlanCommand);
const session = vi.mocked(requireTenantSession);
const permissions = vi.mocked(requireTenantPermissions);
const context = {
  params: Promise.resolve({ id: '7' }),
} as RouteContext<'/api/v1/patients/[id]/treatment-plans/assign'>;

function request(body: string) {
  return new NextRequest('http://localhost/api/v1/patients/7/treatment-plans/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

describe('POST Patient Treatment Plan assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.mockResolvedValue({ tenantId: 'tenant-a' } as never);
    permissions.mockResolvedValue(null);
    command.mockResolvedValue({ success: true, data: { id: 21 } as never });
  });

  it('requires session and Plan assignment permission', async () => {
    session.mockResolvedValue(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));
    expect((await POST(request('{}'), context)).status).toBe(401);
    expect(command).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON', async () => {
    expect((await POST(request('{'), context)).status).toBe(400);
    expect(command).not.toHaveBeenCalled();
  });

  it('passes only the session Tenant to the command and returns the created Plan', async () => {
    const response = await POST(
      request(JSON.stringify({ treatmentId: 11, totalSessions: 5 })),
      context
    );
    expect(permissions).toHaveBeenCalledWith(expect.anything(), [
      'patient-treatment-plan:read',
      'patient-treatment-plan:assign',
    ]);
    expect(command).toHaveBeenCalledWith('7', 'tenant-a', { treatmentId: 11, totalSessions: 5 });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: { id: 21 } });
  });

  it('returns validation errors from the command', async () => {
    command.mockResolvedValue({
      success: false,
      status: 409,
      errors: ['Treatment has no Session templates.'],
    });
    const response = await POST(request(JSON.stringify({ treatmentId: 11 })), context);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      errors: ['Treatment has no Session templates.'],
    });
  });
});
