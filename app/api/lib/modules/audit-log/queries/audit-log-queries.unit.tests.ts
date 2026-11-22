import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { auditLogRepository } from '../repository/audit-log-repository';
import { AUDIT_EXPORT_MAX_ROWS, AUDIT_PDF_EXPORT_MAX_ROWS } from '../schemas/audit-log-schema';
import { exportAuditEventsQuery } from './export-audit-events-query';
import { getAuditEventsQuery } from './get-audit-events-query';

vi.mock('../repository/audit-log-repository', () => ({
  auditLogRepository: {
    getAuditEvents: vi.fn(),
    countAuditEvents: vi.fn(),
    getAuditEventsForExport: vi.fn(),
  },
}));
vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));

const repo = vi.mocked(auditLogRepository);
const tenants = vi.mocked(tenantRepository);

describe('Audit Log queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tenants.getTenantById.mockResolvedValue({
      name: 'Apollo Hospitals',
      timeZone: 'Asia/Dubai',
    } as never);
    repo.getAuditEvents.mockResolvedValue({ data: [], total: 0 });
    repo.countAuditEvents.mockResolvedValue(3);
    repo.getAuditEventsForExport.mockResolvedValue([]);
  });

  it('should not touch the repository when the filters are invalid', async () => {
    await expect(getAuditEventsQuery({ category: 'gossip' }, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Audit category is Invalid.'],
    });
    expect(repo.getAuditEvents).not.toHaveBeenCalled();
  });

  it('should pass filters, paging and the Tenant time zone to the repository', async () => {
    await getAuditEventsQuery({ visitId: '12', page: '2', limit: '25' }, 'tenant-1');

    expect(repo.getAuditEvents).toHaveBeenCalledWith({
      visitId: 12,
      page: 2,
      limit: 25,
      tenantId: 'tenant-1',
      timeZone: 'Asia/Dubai',
    });
  });

  it('should return a list result with the total', async () => {
    repo.getAuditEvents.mockResolvedValue({ data: [], total: 9 });

    await expect(getAuditEventsQuery({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: [],
      total: 9,
    });
  });

  it('should fall back to the default time zone when the Tenant is missing', async () => {
    tenants.getTenantById.mockResolvedValue(undefined);
    await getAuditEventsQuery({}, 'tenant-1');

    expect(repo.getAuditEvents).toHaveBeenCalledWith(
      expect.objectContaining({ timeZone: 'Asia/Kolkata' })
    );
  });

  it('should refuse an export above the row cap without reading the rows', async () => {
    repo.countAuditEvents.mockResolvedValue(AUDIT_EXPORT_MAX_ROWS + 1);
    const result = await exportAuditEventsQuery({}, 'tenant-1');

    expect(result).toMatchObject({ success: false, status: StatusCodes.UNPROCESSABLE_ENTITY });
    expect(repo.getAuditEventsForExport).not.toHaveBeenCalled();
  });

  it('should return the exported rows with the applied filters', async () => {
    const result = await exportAuditEventsQuery({ patientId: '7' }, 'tenant-1');

    expect(repo.getAuditEventsForExport).toHaveBeenCalledWith(
      { patientId: 7, tenantId: 'tenant-1', timeZone: 'Asia/Dubai' },
      AUDIT_EXPORT_MAX_ROWS
    );
    expect(result).toEqual({
      success: true,
      data: {
        events: [],
        format: 'csv',
        filters: { patientId: 7 },
        timeZone: 'Asia/Dubai',
        tenantName: 'Apollo Hospitals',
      },
    });
  });

  it('should read up to the PDF cap for a PDF export and keep the format out of the filters', async () => {
    const result = await exportAuditEventsQuery({ format: 'pdf', module: 'Visits' }, 'tenant-1');

    expect(repo.getAuditEventsForExport).toHaveBeenCalledWith(
      { module: 'Visits', tenantId: 'tenant-1', timeZone: 'Asia/Dubai' },
      AUDIT_PDF_EXPORT_MAX_ROWS
    );
    expect(result).toMatchObject({
      success: true,
      data: { format: 'pdf', filters: { module: 'Visits' } },
    });
  });

  it('should refuse a PDF above its cap and point to the CSV export', async () => {
    repo.countAuditEvents.mockResolvedValue(AUDIT_PDF_EXPORT_MAX_ROWS + 1);

    const result = await exportAuditEventsQuery({ format: 'pdf' }, 'tenant-1');

    expect(result).toEqual({
      success: false,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      errors: [
        'PDF export is limited to 5,000 Audit Events; this selection has 5,001. Narrow the filters or export CSV.',
      ],
    });
    expect(repo.getAuditEventsForExport).not.toHaveBeenCalled();
  });

  it('should reject an unknown export format without counting', async () => {
    await expect(exportAuditEventsQuery({ format: 'xlsx' }, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Format must be csv or pdf'],
    });
    expect(repo.countAuditEvents).not.toHaveBeenCalled();
  });
});
