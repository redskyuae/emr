import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { deleteVisitDocumentCommand } from '@/app/api/lib/modules/visit-document/commands/delete-visit-document-command';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { DELETE } from './route';

vi.mock('@/app/api/lib/analytics/lifecycle-event-recorder', () => ({
  recordLifecycleEvent: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/modules/visit-document/commands/delete-visit-document-command', () => ({
  deleteVisitDocumentCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/visit/queries/get-visit-by-id-query', () => ({
  getVisitByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const deleteDocument = vi.mocked(deleteVisitDocumentCommand);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);
const getVisit = vi.mocked(getVisitByIdQuery);
const recordAudit = vi.mocked(recordAuditEvent);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const context = { params: Promise.resolve({ id: '42', documentId: '5' }) };
const document = {
  id: 5,
  visitId: 42,
  fileName: 'lab-report.pdf',
  contentType: 'application/pdf',
  fileSize: 20480,
};

function request() {
  return new NextRequest('http://localhost/api/v1/visits/42/documents/5', { method: 'DELETE' });
}

describe('Delete Visit Document route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    deleteDocument.mockResolvedValue({ success: true, data: document } as never);
    getVisit.mockResolvedValue({ success: true, data: { id: 42, patient: { id: 9 } } } as never);
  });

  it('should return unauthorized without checking permission', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await DELETE(request(), context);

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(deleteDocument).not.toHaveBeenCalled();
  });

  it('should return forbidden without deleting when visit-document:delete is absent', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await DELETE(request(), context);

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    await expect(response.json()).resolves.toEqual({ message: 'Forbidden' });
    expect(deleteDocument).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it('should require visit-document:delete and delete the Visit Document', async () => {
    const response = await DELETE(request(), context);

    expect(response.status).toBe(StatusCodes.NO_CONTENT);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['visit-document:delete']);
    expect(deleteDocument).toHaveBeenCalledWith('42', '5', 'tenant-1');
    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'visit-document.delete',
      expect.any(Function)
    );
  });
});
