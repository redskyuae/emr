import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { addVisitDocumentCommand } from '@/app/api/lib/modules/visit-document/commands/add-visit-document-command';
import { listVisitDocumentsQuery } from '@/app/api/lib/modules/visit-document/queries/list-visit-documents-query';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET, POST } from './route';

vi.mock('@/app/api/lib/analytics/lifecycle-event-recorder', () => ({
  recordLifecycleEvent: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/modules/visit-document/commands/add-visit-document-command', () => ({
  addVisitDocumentCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/visit-document/queries/list-visit-documents-query', () => ({
  listVisitDocumentsQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/visit/queries/get-visit-by-id-query', () => ({
  getVisitByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);
const listDocuments = vi.mocked(listVisitDocumentsQuery);
const addDocument = vi.mocked(addVisitDocumentCommand);
const getVisit = vi.mocked(getVisitByIdQuery);
const recordAudit = vi.mocked(recordAuditEvent);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const context = { params: Promise.resolve({ id: '42' }) };
const document = {
  id: 5,
  visitId: 42,
  fileName: 'lab-report.pdf',
  contentType: 'application/pdf',
  fileSize: 20480,
};

function request() {
  return new NextRequest('http://localhost/api/v1/visits/42/documents', {
    method: 'POST',
    body: JSON.stringify({ fileName: 'lab-report.pdf' }),
  });
}

function listRequest() {
  return new NextRequest('http://localhost/api/v1/visits/42/documents');
}

function forbidden() {
  return NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN });
}

/** The details the route handed the recorder, resolving a lazy lookup as the recorder does. */
async function recordedDetails() {
  const details = recordAudit.mock.calls[0]?.[3];

  return typeof details === 'function' ? await details() : details;
}

describe('Visit Documents route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    listDocuments.mockResolvedValue({ success: true, data: [document] } as never);
    addDocument.mockResolvedValue({ success: true, data: document } as never);
    getVisit.mockResolvedValue({ success: true, data: { id: 42, patient: { id: 9 } } } as never);
  });

  describe('GET', () => {
    it('should return unauthorized without checking permission', async () => {
      requireSession.mockResolvedValue(
        NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
      );

      const response = await GET(listRequest(), context);

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(requirePermissions).not.toHaveBeenCalled();
      expect(listDocuments).not.toHaveBeenCalled();
    });

    it('should return forbidden without listing when visit-document:read is absent', async () => {
      requirePermissions.mockResolvedValue(forbidden());

      const response = await GET(listRequest(), context);

      expect(response.status).toBe(StatusCodes.FORBIDDEN);
      await expect(response.json()).resolves.toEqual({ message: 'Forbidden' });
      expect(listDocuments).not.toHaveBeenCalled();
    });

    it('should require visit-document:read and list the Visit Documents', async () => {
      const response = await GET(listRequest(), context);

      expect(response.status).toBe(StatusCodes.OK);
      await expect(response.json()).resolves.toEqual({ data: [document] });
      expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['visit-document:read']);
      expect(listDocuments).toHaveBeenCalledWith('42', 'tenant-1');
    });
  });

  describe('POST', () => {
    it('should return forbidden without adding when visit-document:upload is absent', async () => {
      requirePermissions.mockResolvedValue(forbidden());

      const response = await POST(request(), context);

      expect(response.status).toBe(StatusCodes.FORBIDDEN);
      await expect(response.json()).resolves.toEqual({ message: 'Forbidden' });
      expect(addDocument).not.toHaveBeenCalled();
      expect(recordAudit).not.toHaveBeenCalled();
    });

    it('should require visit-document:upload', async () => {
      await POST(request(), context);

      expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['visit-document:upload']);
    });

    it('should record the added document with the Patient read from its Visit', async () => {
      const response = await POST(request(), context);

      expect(response.status).toBe(StatusCodes.CREATED);
      await expect(recordedDetails()).resolves.toEqual({
        entityId: 5,
        visitId: 42,
        patientId: 9,
        entityLabel: 'lab-report.pdf',
        metadata: { contentType: 'application/pdf', fileSize: 20480 },
      });
      expect(getVisit).toHaveBeenCalledWith('42', 'tenant-1');
    });

    it('should answer 201 without waiting on the Visit lookup that only serves the Audit Event', async () => {
      getVisit.mockRejectedValue(new Error('database down'));

      const response = await POST(request(), context);

      expect(response.status).toBe(StatusCodes.CREATED);
      expect(getVisit).not.toHaveBeenCalled();
    });
  });
});
