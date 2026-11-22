import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { auditReportContext } from '@/app/api/lib/audit/audit-export-response';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { toUserAuditListCsv, toUserAuditListPdf } from '@/app/api/lib/audit/user-audit-export';
import { exportUserAuditListQuery } from '@/app/api/lib/modules/audit-log/queries/export-user-audit-list-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET } from './route';

vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantSession: vi.fn(),
  requireTenantPermissions: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/audit-log/queries/export-user-audit-list-query', () => ({
  exportUserAuditListQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/audit/user-audit-export', () => ({
  toUserAuditListCsv: vi.fn(() => 'csv-body'),
  toUserAuditListPdf: vi.fn(async () => new Uint8Array([37, 80, 68, 70])),
}));
vi.mock('@/app/api/lib/audit/audit-export-response', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/api/lib/audit/audit-export-response')>()),
  auditReportContext: vi.fn(),
}));

const exportQuery = vi.mocked(exportUserAuditListQuery);
const recordAudit = vi.mocked(recordAuditEvent);
const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };

function exportRequest(query: string) {
  return new NextRequest(`http://localhost/api/v1/audit-log/users/export?${query}`);
}

describe('User Audit list export route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireTenantSession).mockResolvedValue(tenantSession as never);
    vi.mocked(requireTenantPermissions).mockResolvedValue(null);
    vi.mocked(auditReportContext).mockResolvedValue({
      exportedAt: new Date('2026-11-22T08:00:00Z'),
    } as never);
  });

  it('should pass the range, search and format and send the PDF', async () => {
    exportQuery.mockResolvedValue({
      success: true,
      data: {
        users: [],
        format: 'pdf',
        timeZone: 'Asia/Dubai',
        tenantName: 'Apollo Hospitals',
        filters: { query: 'sara' },
      },
    });

    const response = await GET(exportRequest('query=sara&format=pdf&page=2'));

    expect(exportQuery).toHaveBeenCalledWith({ query: 'sara', format: 'pdf' }, 'tenant-1');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="user-audit-events-2026-11-22.pdf"'
    );
    expect(toUserAuditListPdf).toHaveBeenCalled();
    expect(toUserAuditListCsv).not.toHaveBeenCalled();
    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.any(NextRequest),
      'user-audit.list-export',
      { metadata: { filters: { query: 'sara' }, rowCount: 0, format: 'pdf' } }
    );
  });

  it('should return the cap message as a 422', async () => {
    exportQuery.mockResolvedValue({
      success: false,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      errors: ['Export is limited to 5,000 users; this search has 5,001.'],
    });

    const response = await GET(exportRequest(''));

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect((await response.json()).message).toBe(
      'Export is limited to 5,000 users; this search has 5,001.'
    );
    expect(recordAudit).not.toHaveBeenCalled();
  });
});
