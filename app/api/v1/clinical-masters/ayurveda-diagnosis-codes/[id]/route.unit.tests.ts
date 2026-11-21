import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteAyurvedaDiagnosisCodeCommand } from '@/app/api/lib/modules/ayurveda-diagnosis-code/commands/delete-ayurveda-diagnosis-code-command';
import { updateAyurvedaDiagnosisCodeCommand } from '@/app/api/lib/modules/ayurveda-diagnosis-code/commands/update-ayurveda-diagnosis-code-command';
import { getAyurvedaDiagnosisCodeByIdQuery } from '@/app/api/lib/modules/ayurveda-diagnosis-code/queries/get-ayurveda-diagnosis-code-by-id-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { DELETE, GET, PUT } from './route';

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
  () => ({ getAyurvedaDiagnosisCodeByIdQuery: vi.fn() })
);
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const deleteCode = vi.mocked(deleteAyurvedaDiagnosisCodeCommand);
const updateCode = vi.mocked(updateAyurvedaDiagnosisCodeCommand);
const getCode = vi.mocked(getAyurvedaDiagnosisCodeByIdQuery);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = {
  tenantId: 'tenant-1',
  session: { user: { id: 'user-1' }, session: { impersonatedBy: null } },
};
const body = { code: 'AYU-JWR', name: 'Jwara', icdDiagnosisCodeId: 12 };
const code = { id: 7, code: 'AYU-JWR', name: 'Jwara' };
const url = 'http://localhost/api/v1/clinical-masters/ayurveda-diagnosis-codes/7';
const forbidden = () =>
  NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN });

function context(id = '7') {
  return { params: Promise.resolve({ id }) };
}

function putRequest(rawBody = JSON.stringify(body)) {
  return new NextRequest(url, {
    method: 'PUT',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Ayurveda Diagnosis Code item route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    getCode.mockResolvedValue({ success: true, data: code } as never);
    updateCode.mockResolvedValue({ success: true, data: code } as never);
    deleteCode.mockResolvedValue({ success: true, data: undefined } as never);
  });

  it('should read a code for any Tenant member without a permission check', async () => {
    const response = await GET(new NextRequest(url), context());

    expect(response.status).toBe(StatusCodes.OK);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(getCode).toHaveBeenCalledWith('7', 'tenant-1');
  });

  it('should return forbidden without updating when ayurveda-diagnosis-code:update is absent', async () => {
    requirePermissions.mockResolvedValue(forbidden());

    const response = await PUT(putRequest(), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, [
      'ayurveda-diagnosis-code:update',
    ]);
    expect(updateCode).not.toHaveBeenCalled();
  });

  it('should update the code for the active Tenant when permitted', async () => {
    const response = await PUT(putRequest(), context());

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toEqual({ data: code });
    expect(updateCode).toHaveBeenCalledWith('7', 'tenant-1', body);
  });

  it('should return forbidden without deleting when ayurveda-diagnosis-code:delete is absent', async () => {
    requirePermissions.mockResolvedValue(forbidden());

    const response = await DELETE(new NextRequest(url, { method: 'DELETE' }), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, [
      'ayurveda-diagnosis-code:delete',
    ]);
    expect(deleteCode).not.toHaveBeenCalled();
  });

  it('should delete the code for the active Tenant when permitted', async () => {
    const response = await DELETE(new NextRequest(url, { method: 'DELETE' }), context());

    expect(response.status).toBe(StatusCodes.NO_CONTENT);
    expect(deleteCode).toHaveBeenCalledWith('7', 'tenant-1');
  });

  it('should return unauthorized without checking permission on delete', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await DELETE(new NextRequest(url, { method: 'DELETE' }), context());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(deleteCode).not.toHaveBeenCalled();
  });
});
