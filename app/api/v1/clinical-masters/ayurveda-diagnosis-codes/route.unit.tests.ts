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
  requireTenantSession: vi.fn(),
  requireTenantPermissions: vi.fn(),
}));

const create = vi.mocked(createAyurvedaDiagnosisCodeCommand);
const list = vi.mocked(getAyurvedaDiagnosisCodesQuery);
const requireSession = vi.mocked(requireTenantSession);
const requirePermissions = vi.mocked(requireTenantPermissions);

const url = 'http://localhost/api/v1/clinical-masters/ayurveda-diagnosis-codes';
const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const code = { id: 1, code: 'AYU-JVARA', title: 'Jvara (Fever)' };

describe('Ayurveda Diagnosis Codes route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    create.mockResolvedValue({ success: true, data: code as never });
    list.mockResolvedValue({ success: true, data: [code as never], total: 1 });
  });

  it('should let any Tenant member list codes so clinicians can search them', async () => {
    const response = await GET(new NextRequest(url));

    expect(response.status).toBe(StatusCodes.OK);
    expect(requirePermissions).not.toHaveBeenCalled();
  });

  it('should pass the isActive filter to the query', async () => {
    await GET(new NextRequest(`${url}?isActive=true&query=jvara`));

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', isActive: true, query: 'jvara' })
    );
  });

  it('should leave isActive undefined when the filter is absent or unknown', async () => {
    await GET(new NextRequest(`${url}?isActive=maybe`));

    expect(list).toHaveBeenCalledWith(expect.objectContaining({ isActive: undefined }));
  });

  it('should require the create permission before creating a code', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await POST(
      new NextRequest(url, { method: 'POST', body: JSON.stringify({ code: 'AYU-JVARA' }) })
    );

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, [
      'ayurveda-diagnosis-code:create',
    ]);
    expect(create).not.toHaveBeenCalled();
  });

  it('should reject invalid JSON', async () => {
    const response = await POST(new NextRequest(url, { method: 'POST', body: '{' }));

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({ message: 'Request body must be valid JSON' });
  });

  it('should return 201 with the created code', async () => {
    const response = await POST(
      new NextRequest(url, { method: 'POST', body: JSON.stringify({ code: 'AYU-JVARA' }) })
    );

    expect(response.status).toBe(StatusCodes.CREATED);
    await expect(response.json()).resolves.toEqual({ data: code });
  });
});
