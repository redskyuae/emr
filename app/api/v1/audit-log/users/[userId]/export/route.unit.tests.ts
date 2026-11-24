import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { auditReportContext } from '@/app/api/lib/audit/audit-export-response';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { toUserAuditDetailCsv } from '@/app/api/lib/audit/user-audit-export';
import { exportUserAuditDetailQuery } from '@/app/api/lib/modules/audit-log/queries/export-user-audit-detail-query';
import type { UserAuditDetail } from '@/app/api/lib/modules/audit-log/schemas/user-audit-schema';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET } from './route';

vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantSession: vi.fn(),
  requireTenantPermissions: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/audit-log/queries/export-user-audit-detail-query', () => ({
  exportUserAuditDetailQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/audit/user-audit-export', () => ({
  toUserAuditDetailCsv: vi.fn(() => 'csv-body'),
  toUserAuditDetailPdf: vi.fn(async () => new Uint8Array([37, 80, 68, 70])),
}));
vi.mock('@/app/api/lib/audit/audit-export-response', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/api/lib/audit/audit-export-response')>()),
  auditReportContext: vi.fn(),
}));

const exportQuery = vi.mocked(exportUserAuditDetailQuery);
const recordAudit = vi.mocked(recordAuditEvent);
const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'admin-1' } } };
const detail = {
  timeZone: 'Asia/Dubai',
  user: { userId: 'user-1', name: 'Dr. Sara Ali' },
  sessions: [{}, {}],
} as unknown as UserAuditDetail;

function exportRequest(userId: string, query: string) {
  return GET(new NextRequest(`http://localhost/api/v1/audit-log/users/${userId}/export?${query}`), {
    params: Promise.resolve({ userId }),
  });
}

describe('User Audit export route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireTenantSession).mockResolvedValue(tenantSession as never);
    vi.mocked(requireTenantPermissions).mockResolvedValue(null);
    vi.mocked(auditReportContext).mockResolvedValue({
      exportedAt: new Date('2026-11-22T08:00:00Z'),
    } as never);
  });

  it('should send the member’s CSV named after them and record whose audit was exported', async () => {
    exportQuery.mockResolvedValue({
      success: true,
      data: { detail, format: 'csv', tenantName: 'Apollo Hospitals', filters: {} },
    });

    const response = await exportRequest('user-1', 'fromDate=2026-11-01');

    expect(exportQuery).toHaveBeenCalledWith('user-1', { fromDate: '2026-11-01' }, 'tenant-1');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="user-audit-dr-sara-ali-2026-11-22.csv"'
    );
    expect(response.headers.get('X-Audit-Row-Count')).toBe('2');
    expect(toUserAuditDetailCsv).toHaveBeenCalled();
    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.any(NextRequest),
      'user-audit.export',
      {
        entityId: 'user-1',
        entityLabel: 'Dr. Sara Ali',
        metadata: { filters: {}, rowCount: 2, format: 'csv' },
      }
    );
  });

  it('should return 404 for a user outside the Tenant', async () => {
    exportQuery.mockResolvedValue({
      success: false,
      errors: ['User not found'],
      status: StatusCodes.NOT_FOUND,
    });

    const response = await exportRequest('user-9', 'format=pdf');

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(await response.json()).toEqual({
      message: 'User not found',
      errors: ['User not found'],
    });
    expect(recordAudit).not.toHaveBeenCalled();
  });
});
