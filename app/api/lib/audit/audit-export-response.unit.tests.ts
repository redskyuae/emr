import { describe, expect, it, vi } from 'vitest';

import { getExportBrand } from '@/app/api/lib/export/export-brand';
import { auditFileResponse, auditFileSlug, auditReportContext } from './audit-export-response';

vi.mock('@/app/api/lib/export/export-brand', () => ({ getExportBrand: vi.fn() }));

describe('Audit export response', () => {
  it('should turn a name into a safe file name part', () => {
    expect(auditFileSlug('Dr. Sara Ali')).toBe('dr-sara-ali');
    expect(auditFileSlug('José  Müller_Jr')).toBe('jose-muller-jr');
    expect(auditFileSlug('فاطمة')).toBe('user');
  });

  it('should send a PDF as an uncached attachment with its row count', async () => {
    const response = auditFileResponse(new Uint8Array([37, 80, 68, 70]), {
      format: 'pdf',
      rowCount: 3,
      basename: 'audit-events-2026-11-22',
    });

    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Audit-Row-Count')).toBe('3');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="audit-events-2026-11-22.pdf"'
    );
    expect(await response.text()).toBe('%PDF');
  });

  it('should send a CSV as UTF-8 text', async () => {
    const response = auditFileResponse('a,b\r\n', {
      format: 'csv',
      rowCount: 1,
      basename: 'user-audit-events-2026-11-22',
    });

    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    expect(await response.text()).toBe('a,b\r\n');
  });

  it('should name the signed-in user as the exporter', async () => {
    vi.mocked(getExportBrand).mockResolvedValue({
      organizationName: 'Medical EMR',
      organizationSubtitle: 'Redsky Consultancy',
    });

    const context = await auditReportContext(
      {
        tenantId: 'tenant-1',
        session: { user: { name: 'Priya Nair', email: 'priya@hospital.example' } },
      } as never,
      { tenantName: 'Apollo Hospitals', timeZone: 'Asia/Dubai' }
    );

    expect(context).toMatchObject({
      tenantName: 'Apollo Hospitals',
      timeZone: 'Asia/Dubai',
      exportedBy: { name: 'Priya Nair', email: 'priya@hospital.example' },
    });
    expect(context.exportedAt).toBeInstanceOf(Date);
  });
});
