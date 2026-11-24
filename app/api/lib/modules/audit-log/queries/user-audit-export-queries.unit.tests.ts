import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { userAuditRepository } from '../repository/user-audit-repository';
import {
  USER_AUDIT_EXPORT_MAX_USERS,
  type UserAuditDetail,
  type UserAuditListItem,
} from '../schemas/user-audit-schema';
import { exportUserAuditDetailQuery } from './export-user-audit-detail-query';
import { exportUserAuditListQuery } from './export-user-audit-list-query';
import { getUserAuditDetailQuery } from './get-user-audit-detail-query';

vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));
vi.mock('../repository/user-audit-repository', () => ({
  userAuditRepository: { getUserAuditList: vi.fn() },
}));
vi.mock('./get-user-audit-detail-query', () => ({ getUserAuditDetailQuery: vi.fn() }));

const repo = vi.mocked(userAuditRepository);
const tenants = vi.mocked(tenantRepository);
const getDetail = vi.mocked(getUserAuditDetailQuery);

const detail = { timeZone: 'Asia/Dubai', user: { userId: 'user-1' } } as UserAuditDetail;

describe('User Audit export queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tenants.getTenantById.mockResolvedValue({
      name: 'Apollo Hospitals',
      timeZone: 'Asia/Dubai',
    } as never);
    repo.getUserAuditList.mockResolvedValue({ data: [], total: 0 });
    getDetail.mockResolvedValue({ success: true, data: detail });
  });

  it('should read every member up to the cap for the list export', async () => {
    const result = await exportUserAuditListQuery(
      { fromDate: '2026-11-01', toDate: '2026-11-22', query: 'sara', format: 'pdf' },
      'tenant-1'
    );

    expect(repo.getUserAuditList).toHaveBeenCalledWith({
      fromDate: '2026-11-01',
      toDate: '2026-11-22',
      query: 'sara',
      tenantId: 'tenant-1',
      timeZone: 'Asia/Dubai',
      page: 1,
      limit: USER_AUDIT_EXPORT_MAX_USERS + 1,
    });
    expect(result).toEqual({
      success: true,
      data: {
        users: [],
        format: 'pdf',
        timeZone: 'Asia/Dubai',
        tenantName: 'Apollo Hospitals',
        filters: { fromDate: '2026-11-01', toDate: '2026-11-22', query: 'sara' },
      },
    });
  });

  it('should export CSV when no format is given', async () => {
    const result = await exportUserAuditListQuery({}, 'tenant-1');

    expect(result).toMatchObject({ success: true, data: { format: 'csv' } });
  });

  it('should refuse a list export above the cap rather than cut it', async () => {
    repo.getUserAuditList.mockResolvedValue({ data: [], total: USER_AUDIT_EXPORT_MAX_USERS + 1 });

    await expect(exportUserAuditListQuery({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      errors: [
        'Export is limited to 5,000 users; this search has 5,001. Narrow the search and try again.',
      ],
    });
  });

  it('should refuse a list export when a member past the cap comes back after the count', async () => {
    repo.getUserAuditList.mockResolvedValue({
      data: Array.from(
        { length: USER_AUDIT_EXPORT_MAX_USERS + 1 },
        (_, index) => ({ userId: `user-${index}` }) as UserAuditListItem
      ),
      total: USER_AUDIT_EXPORT_MAX_USERS,
    });

    await expect(exportUserAuditListQuery({}, 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      errors: [
        'Export is limited to 5,000 users; this search has 5,001. Narrow the search and try again.',
      ],
    });
  });

  it('should not read members when the list filters are invalid', async () => {
    await expect(
      exportUserAuditListQuery({ format: 'docx', fromDate: '22-11-2026' }, 'tenant-1')
    ).resolves.toEqual({
      success: false,
      errors: [
        'From date must be a date in YYYY-MM-DD format',
        'From date is Invalid.',
        'Format must be csv or pdf',
      ],
    });
    expect(repo.getUserAuditList).not.toHaveBeenCalled();
  });

  it('should export one member’s audit with the Tenant name and the range', async () => {
    const result = await exportUserAuditDetailQuery(
      'user-1',
      { fromDate: '2026-11-01', format: 'pdf' },
      'tenant-1'
    );

    expect(getDetail).toHaveBeenCalledWith('user-1', { fromDate: '2026-11-01' }, 'tenant-1');
    expect(result).toEqual({
      success: true,
      data: {
        detail,
        format: 'pdf',
        tenantName: 'Apollo Hospitals',
        filters: { fromDate: '2026-11-01' },
      },
    });
  });

  it('should pass on a member who is not found', async () => {
    getDetail.mockResolvedValue({
      success: false,
      errors: ['User not found'],
      status: StatusCodes.NOT_FOUND,
    });

    await expect(exportUserAuditDetailQuery('user-9', {}, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['User not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should not read the member when the format is unknown', async () => {
    await expect(
      exportUserAuditDetailQuery('user-1', { format: 'xml' }, 'tenant-1')
    ).resolves.toEqual({ success: false, errors: ['Format must be csv or pdf'] });
    expect(getDetail).not.toHaveBeenCalled();
  });
});
