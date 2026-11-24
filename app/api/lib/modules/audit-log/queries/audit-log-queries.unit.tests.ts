import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { auditLogRepository } from '../repository/audit-log-repository';
import {
  AUDIT_EXPORT_MAX_ROWS,
  AUDIT_PDF_EXPORT_MAX_ROWS,
  type AuditEventListItem,
} from '../schemas/audit-log-schema';
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
const rows = (n: number) =>
  Array.from({ length: n }, (_, index) => ({ id: index + 1 }) as AuditEventListItem);
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

  it('should refuse an export when a row past the cap comes back', async () => {
    repo.getAuditEventsForExport.mockResolvedValue(rows(AUDIT_EXPORT_MAX_ROWS + 1));
    repo.countAuditEvents.mockResolvedValue(AUDIT_EXPORT_MAX_ROWS + 20);
    const result = await exportAuditEventsQuery({}, 'tenant-1');

    expect(result).toEqual({
      success: false,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      errors: [
        'Export is limited to 50,000 Audit Events; this selection has 50,020. Narrow the filters and try again.',
      ],
    });
  });

  it('should export exactly the cap without counting', async () => {
    repo.getAuditEventsForExport.mockResolvedValue(rows(AUDIT_EXPORT_MAX_ROWS));
    const result = await exportAuditEventsQuery({}, 'tenant-1');

    expect(result).toMatchObject({ success: true });
    expect(result.success && result.data.events).toHaveLength(AUDIT_EXPORT_MAX_ROWS);
    expect(repo.countAuditEvents).not.toHaveBeenCalled();
  });

  it('should return the exported rows with the applied filters', async () => {
    const result = await exportAuditEventsQuery({ patientId: '7' }, 'tenant-1');

    expect(repo.getAuditEventsForExport).toHaveBeenCalledWith(
      { patientId: 7, tenantId: 'tenant-1', timeZone: 'Asia/Dubai' },
      AUDIT_EXPORT_MAX_ROWS + 1
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
      AUDIT_PDF_EXPORT_MAX_ROWS + 1
    );
    expect(result).toMatchObject({
      success: true,
      data: { format: 'pdf', filters: { module: 'Visits' } },
    });
  });

  it('should refuse a PDF above its cap and point to the CSV export', async () => {
    repo.getAuditEventsForExport.mockResolvedValue(rows(AUDIT_PDF_EXPORT_MAX_ROWS + 1));
    repo.countAuditEvents.mockResolvedValue(AUDIT_PDF_EXPORT_MAX_ROWS + 1);

    const result = await exportAuditEventsQuery({ format: 'pdf' }, 'tenant-1');

    expect(result).toEqual({
      success: false,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      errors: [
        'PDF export is limited to 5,000 Audit Events; this selection has 5,001. Narrow the filters or export CSV.',
      ],
    });
  });

  it('should reject an unknown export format without reading the rows', async () => {
    await expect(exportAuditEventsQuery({ format: 'xlsx' }, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Format must be csv or pdf'],
    });
    expect(repo.getAuditEventsForExport).not.toHaveBeenCalled();
    expect(repo.countAuditEvents).not.toHaveBeenCalled();
  });
});
