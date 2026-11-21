import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAyurvedaDiagnosisCodeCommand } from '@/app/api/lib/modules/ayurveda-diagnosis-code/commands/create-ayurveda-diagnosis-code-command';
import { getAyurvedaDiagnosisCodesQuery } from '@/app/api/lib/modules/ayurveda-diagnosis-code/queries/get-ayurveda-diagnosis-codes-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET, POST } from './route';

vi.mock(
  '@/app/api/lib/modules/ayurveda-diagnosis-code/commands/create-ayurveda-diagnosis-code-command',
  () => ({ createAyurvedaDiagnosisCodeCommand: vi.fn() })
);
vi.mock(
  '@/app/api/lib/modules/ayurveda-diagnosis-code/queries/get-ayurveda-diagnosis-codes-query',
  () => ({ getAyurvedaDiagnosisCodesQuery: vi.fn() })
);
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const createCode = vi.mocked(createAyurvedaDiagnosisCodeCommand);
const listCodes = vi.mocked(getAyurvedaDiagnosisCodesQuery);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const body = { code: 'AYU-JWR', name: 'Jwara', icdDiagnosisCodeId: 12 };
const code = { id: 1, code: 'AYU-JWR', name: 'Jwara' };

function postRequest(rawBody = JSON.stringify(body)) {
  return new NextRequest('http://localhost/api/v1/clinical-masters/ayurveda-diagnosis-codes', {
    method: 'POST',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Ayurveda Diagnosis Code collection route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    createCode.mockResolvedValue({ success: true, data: code } as never);
    listCodes.mockResolvedValue({ success: true, data: [code], total: 1 } as never);
  });

  it('should list codes for any Tenant member without a permission check', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/v1/clinical-masters/ayurveda-diagnosis-codes?page=1')
    );

    expect(response.status).toBe(StatusCodes.OK);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(listCodes).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1' }));
  });

  it('should return unauthorized without checking permission or creating', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await POST(postRequest());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(createCode).not.toHaveBeenCalled();
  });

  it('should return forbidden without creating when ayurveda-diagnosis-code:create is absent', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await POST(postRequest());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, [
      'ayurveda-diagnosis-code:create',
    ]);
    expect(createCode).not.toHaveBeenCalled();
  });

  it('should reject invalid JSON before creating', async () => {
    const response = await POST(postRequest('{'));

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({ message: 'Request body must be valid JSON' });
    expect(createCode).not.toHaveBeenCalled();
  });

  it('should create the code for the active Tenant when permitted', async () => {
    const response = await POST(postRequest());

    expect(response.status).toBe(StatusCodes.CREATED);
    await expect(response.json()).resolves.toEqual({ data: code });
    expect(createCode).toHaveBeenCalledWith(body, 'tenant-1');
  });
});
