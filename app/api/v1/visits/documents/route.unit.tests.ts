import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadVisitDocument } from '@/app/api/lib/storage/visit-document-storage';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { POST } from './route';

vi.mock('@/app/api/lib/storage/visit-document-storage', () => ({
  uploadVisitDocument: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const upload = vi.mocked(uploadVisitDocument);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const uploaded = {
  fileName: 'lab-report.pdf',
  fileUrl: 'https://blob.example.com/tenants/tenant-1/visit-documents/lab-report-x1.pdf',
  contentType: 'application/pdf',
  fileSize: 3,
};

function request() {
  const formData = new FormData();
  formData.set('file', new File(['pdf'], 'lab-report.pdf', { type: 'application/pdf' }));

  return new NextRequest('http://localhost/api/v1/visits/documents', {
    method: 'POST',
    body: formData,
  });
}

describe('Upload Visit Document route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-blob-token');
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    upload.mockResolvedValue(uploaded);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return unauthorized without checking permission', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await POST(request());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it('should return forbidden without uploading when visit-document:upload is absent', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await POST(request());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    await expect(response.json()).resolves.toEqual({ message: 'Forbidden' });
    expect(upload).not.toHaveBeenCalled();
  });

  it('should require visit-document:upload and upload the file for the active Tenant', async () => {
    const response = await POST(request());

    expect(response.status).toBe(StatusCodes.CREATED);
    await expect(response.json()).resolves.toEqual({ data: uploaded });
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['visit-document:upload']);
    expect(upload).toHaveBeenCalledWith('tenant-1', expect.any(File));
  });
});
