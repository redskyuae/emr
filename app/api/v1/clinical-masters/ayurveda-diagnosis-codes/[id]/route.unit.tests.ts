import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteAyurvedaDiagnosisCodeCommand } from '@/app/api/lib/modules/ayurveda-diagnosis-code/commands/delete-ayurveda-diagnosis-code-command';
import { updateAyurvedaDiagnosisCodeCommand } from '@/app/api/lib/modules/ayurveda-diagnosis-code/commands/update-ayurveda-diagnosis-code-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { DELETE, PUT } from './route';

vi.mock(
  '@/app/api/lib/modules/ayurveda-diagnosis-code/commands/delete-ayurveda-diagnosis-code-command',
  () => ({ deleteAyurvedaDiagnosisCodeCommand: vi.fn() })
);
vi.mock(
  '@/app/api/lib/modules/ayurveda-diagnosis-code/commands/update-ayurveda-diagnosis-code-command',
  () => ({ updateAyurvedaDiagnosisCodeCommand: vi.fn() })
);
vi.mock(
  '@/app/api/lib/modules/ayurveda-diagnosis-code/queries/get-ayurveda-diagnosis-code-by-id-query',
  () => ({
    getAyurvedaDiagnosisCodeByIdQuery: vi.fn(),
  })
);
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantSession: vi.fn(),
  requireTenantPermissions: vi.fn(),
}));

const update = vi.mocked(updateAyurvedaDiagnosisCodeCommand);
const remove = vi.mocked(deleteAyurvedaDiagnosisCodeCommand);
const requireSession = vi.mocked(requireTenantSession);
const requirePermissions = vi.mocked(requireTenantPermissions);

const url = 'http://localhost/api/v1/clinical-masters/ayurveda-diagnosis-codes/1';
const context = { params: Promise.resolve({ id: '1' }) };
const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const forbidden = () =>
  NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN });

describe('Ayurveda Diagnosis Code route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
  });

  it('should require the update permission before updating a code', async () => {
    requirePermissions.mockResolvedValue(forbidden());

    const response = await PUT(
      new NextRequest(url, { method: 'PUT', body: JSON.stringify({}) }),
      context
    );

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, [
      'ayurveda-diagnosis-code:update',
    ]);
    expect(update).not.toHaveBeenCalled();
  });

  it('should require the delete permission before deleting a code', async () => {
    requirePermissions.mockResolvedValue(forbidden());

    const response = await DELETE(new NextRequest(url, { method: 'DELETE' }), context);

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, [
      'ayurveda-diagnosis-code:delete',
    ]);
    expect(remove).not.toHaveBeenCalled();
  });

  it('should return 204 after deleting a code', async () => {
    remove.mockResolvedValue({ success: true, data: { id: 1 } as never });

    const response = await DELETE(new NextRequest(url, { method: 'DELETE' }), context);

    expect(response.status).toBe(StatusCodes.NO_CONTENT);
  });
});
