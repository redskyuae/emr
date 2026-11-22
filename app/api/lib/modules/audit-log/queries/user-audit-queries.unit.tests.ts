import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { userAuditRepository } from '../repository/user-audit-repository';
import { USER_AUDIT_DETAIL_LIMIT } from '../schemas/user-audit-schema';
import { getUserAuditDetailQuery } from './get-user-audit-detail-query';
import { getUserAuditListQuery } from './get-user-audit-list-query';

vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));
vi.mock('../repository/user-audit-repository', () => ({
  userAuditRepository: {
    getDevices: vi.fn(),
    getSignIns: vi.fn(),
    getIpAddresses: vi.fn(),
    getLiveSessions: vi.fn(),
    getActionCounts: vi.fn(),
    getFailedSignIns: vi.fn(),
    getUserAuditList: vi.fn(),
    getUserAuditMember: vi.fn(),
    getSessionActivity: vi.fn(),
    getSessionEndEvents: vi.fn(),
    countDistinctInRange: vi.fn(),
  },
}));

const repo = vi.mocked(userAuditRepository);
const tenants = vi.mocked(tenantRepository);

const member = {
  userId: 'user-1',
  name: 'Dr. Sara Ali',
  email: 'sara.ali@hospital.example',
  roles: 'Doctor',
  isActive: true,
  staffCode: 'DR-01',
  lastSignInAt: null,
  lastSignInIp: null,
  lastSignInUserAgent: null,
  lastActivityAt: null,
  signInCount: 2,
  failedSignInCount: 1,
  actionCount: 9,
  activeSessionCount: 1,
  memberSince: new Date('2026-01-01T00:00:00Z'),
  accountCreatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('User Audit queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tenants.getTenantById.mockResolvedValue({ timeZone: 'Asia/Dubai' } as never);
    repo.getUserAuditList.mockResolvedValue({ data: [], total: 0 });
    repo.getUserAuditMember.mockResolvedValue(member);
    repo.getSignIns.mockResolvedValue([]);
    repo.getLiveSessions.mockResolvedValue([]);
    repo.getFailedSignIns.mockResolvedValue([]);
    repo.getIpAddresses.mockResolvedValue([]);
    repo.getDevices.mockResolvedValue([]);
    repo.getActionCounts.mockResolvedValue([]);
    repo.countDistinctInRange.mockResolvedValue({ ipAddressCount: 1, deviceCount: 2 });
    repo.getSessionEndEvents.mockResolvedValue([]);
    repo.getSessionActivity.mockResolvedValue([]);
  });

  it('should not read the list when the filters are invalid', async () => {
    await expect(getUserAuditListQuery({ fromDate: 'soon' }, 'tenant-1')).resolves.toMatchObject({
      success: false,
    });
    expect(repo.getUserAuditList).not.toHaveBeenCalled();
  });

  it('should pass the range, paging and Tenant time zone to the list', async () => {
    await getUserAuditListQuery({ fromDate: '2026-11-01', page: '2' }, 'tenant-1');

    expect(repo.getUserAuditList).toHaveBeenCalledWith({
      fromDate: '2026-11-01',
      page: 2,
      tenantId: 'tenant-1',
      timeZone: 'Asia/Dubai',
    });
  });

  it('should not find a user who is not a member of the Tenant', async () => {
    repo.getUserAuditMember.mockResolvedValue(undefined);

    await expect(getUserAuditDetailQuery('user-9', {}, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['User not found'],
      status: StatusCodes.NOT_FOUND,
    });
    expect(repo.getSignIns).not.toHaveBeenCalled();
  });

  it('should group actions by Module and report the summary', async () => {
    repo.getActionCounts.mockResolvedValue([
      { action: 'visit.view', count: 3 },
      { action: 'clinical-note.amend', count: 2 },
      { action: 'patient.view', count: 4 },
      { action: 'retired.action', count: 5 },
    ]);

    const result = await getUserAuditDetailQuery('user-1', {}, 'tenant-1');

    expect(result).toMatchObject({
      success: true,
      data: {
        timeZone: 'Asia/Dubai',
        user: { userId: 'user-1', roles: 'Doctor', staffCode: 'DR-01' },
        summary: { signInCount: 2, failedSignInCount: 1, ipAddressCount: 1, deviceCount: 2 },
        activityByModule: [
          { module: 'Visits', count: 5 },
          { module: 'Patients', count: 4 },
        ],
        sessionsTruncated: false,
      },
    });
  });

  it('should flag the Session list as cut when there are more sign-ins than it shows', async () => {
    repo.getSignIns.mockResolvedValue(
      Array.from({ length: USER_AUDIT_DETAIL_LIMIT + 1 }, (_, index) => ({
        sessionId: `s${index}`,
        occurredOn: new Date(Date.UTC(2026, 10, 1, 0, index)),
        ipAddress: null,
        userAgent: null,
        rememberMe: null,
      }))
    );

    const result = await getUserAuditDetailQuery('user-1', {}, 'tenant-1');

    expect(result.success && result.data.sessions).toHaveLength(USER_AUDIT_DETAIL_LIMIT);
    expect(result.success && result.data.sessionsTruncated).toBe(true);
    expect(repo.getSessionEndEvents).toHaveBeenCalledWith('tenant-1', 'user-1', expect.any(Date));
  });
});
