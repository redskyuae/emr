import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toAuditCsv } from '@/app/api/lib/audit/audit-csv';
import { auditReportContext } from '@/app/api/lib/audit/audit-export-response';
import { toAuditPdf } from '@/app/api/lib/audit/audit-pdf';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { exportAuditEventsQuery } from '@/app/api/lib/modules/audit-log/queries/export-audit-events-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET } from './route';

vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantSession: vi.fn(),
  requireTenantPermissions: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/audit-log/queries/export-audit-events-query', () => ({
  exportAuditEventsQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/audit/audit-csv', () => ({ toAuditCsv: vi.fn(() => 'csv-body') }));
vi.mock('@/app/api/lib/audit/audit-pdf', () => ({
  toAuditPdf: vi.fn(async () => new Uint8Array([37, 80, 68, 70])),
}));
vi.mock('@/app/api/lib/audit/audit-export-response', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/api/lib/audit/audit-export-response')>()),
  auditReportContext: vi.fn(),
}));

const session = vi.mocked(requireTenantSession);
const permissions = vi.mocked(requireTenantPermissions);
const exportQuery = vi.mocked(exportAuditEventsQuery);
const recordAudit = vi.mocked(recordAuditEvent);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const exportedAt = new Date('2026-11-22T08:00:00Z');

function exportRequest(query: string) {
  return new NextRequest(`http://localhost/api/v1/audit-log/export?${query}`);
}

function exportResult(format: 'csv' | 'pdf') {
  return {
    success: true as const,
    data: {
      events: [],
      format,
      timeZone: 'Asia/Dubai',
      tenantName: 'Apollo Hospitals',
      filters: { module: 'Visits' as const },
    },
  };
}

describe('Audit Events export route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.mockResolvedValue(tenantSession as never);
    permissions.mockResolvedValue(null);
    vi.mocked(auditReportContext).mockResolvedValue({ exportedAt } as never);
  });

  it('should require both read and export permissions', async () => {
    permissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await GET(exportRequest('format=pdf'));

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(permissions).toHaveBeenCalledWith(tenantSession, ['audit-log:read', 'audit-log:export']);
    expect(exportQuery).not.toHaveBeenCalled();
  });

  it('should pass the filters and format to the query', async () => {
    exportQuery.mockResolvedValue(exportResult('pdf'));

    await GET(exportRequest('module=Visits&format=pdf&page=3&fromDate=%202026-11-01%20'));

    expect(exportQuery).toHaveBeenCalledWith(
      { module: 'Visits', format: 'pdf', fromDate: '2026-11-01' },
      'tenant-1'
    );
  });

  it('should send a PDF and record the export with its format', async () => {
    exportQuery.mockResolvedValue(exportResult('pdf'));

    const response = await GET(exportRequest('format=pdf'));

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="audit-events-2026-11-22.pdf"'
    );
    expect(toAuditPdf).toHaveBeenCalled();
    expect(toAuditCsv).not.toHaveBeenCalled();
    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.any(NextRequest),
      'audit-log.export',
      {
        metadata: { filters: { module: 'Visits' }, rowCount: 0, format: 'pdf' },
      }
    );
  });

  it('should send a CSV by default', async () => {
    exportQuery.mockResolvedValue(exportResult('csv'));

    const response = await GET(exportRequest(''));

    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    expect(await response.text()).toBe('csv-body');
  });

  it('should return the cap message as a 422 without recording an export', async () => {
    exportQuery.mockResolvedValue({
      success: false,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      errors: ['PDF export is limited to 5,000 Audit Events; this selection has 5,001.'],
    });

    const response = await GET(exportRequest('format=pdf'));

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(await response.json()).toEqual({
      message: 'PDF export is limited to 5,000 Audit Events; this selection has 5,001.',
      errors: ['PDF export is limited to 5,000 Audit Events; this selection has 5,001.'],
    });
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it('should report an unknown format as a validation failure', async () => {
    exportQuery.mockResolvedValue({ success: false, errors: ['Format must be csv or pdf'] });

    const response = await GET(exportRequest('format=xlsx'));

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(await response.json()).toEqual({
      message: 'Validation failed',
      errors: ['Format must be csv or pdf'],
    });
  });
});
