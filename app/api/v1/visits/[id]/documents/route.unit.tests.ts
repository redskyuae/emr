import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { addVisitDocumentCommand } from '@/app/api/lib/modules/visit-document/commands/add-visit-document-command';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { POST } from './route';

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
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantSession: vi.fn() }));

const requireSession = vi.mocked(requireTenantSession);
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

/** The details the route handed the recorder, resolving a lazy lookup as the recorder does. */
async function recordedDetails() {
  const details = recordAudit.mock.calls[0]?.[3];

  return typeof details === 'function' ? await details() : details;
}

describe('Add Visit Document route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    addDocument.mockResolvedValue({ success: true, data: document } as never);
    getVisit.mockResolvedValue({ success: true, data: { id: 42, patient: { id: 9 } } } as never);
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
