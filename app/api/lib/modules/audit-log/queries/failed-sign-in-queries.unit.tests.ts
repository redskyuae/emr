import { beforeEach, describe, expect, it, vi } from 'vitest';

import { failedSignInRepository } from '../repository/failed-sign-in-repository';
import { hasReachedFailedSignInAuditCapQuery } from './has-reached-failed-sign-in-audit-cap-query';

vi.mock('../repository/failed-sign-in-repository', () => ({
  failedSignInRepository: { countFailedSignInsSince: vi.fn() },
}));

const repo = vi.mocked(failedSignInRepository);
const now = new Date('2026-11-24T10:00:00.000Z');

describe('hasReachedFailedSignInAuditCapQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should count the failed sign-ins of the last 15 minutes in that Tenant', async () => {
    repo.countFailedSignInsSince.mockResolvedValue(0);

    await hasReachedFailedSignInAuditCapQuery('tenant-1', 'user-1', now);

    expect(repo.countFailedSignInsSince).toHaveBeenCalledWith(
      'tenant-1',
      'user-1',
      new Date('2026-11-24T09:45:00.000Z')
    );
  });

  it('should not be at the cap below 10 recorded failed sign-ins', async () => {
    repo.countFailedSignInsSince.mockResolvedValue(9);

    await expect(hasReachedFailedSignInAuditCapQuery('tenant-1', 'user-1', now)).resolves.toEqual({
      success: true,
      data: false,
    });
  });

  it('should be at the cap from 10 recorded failed sign-ins', async () => {
    repo.countFailedSignInsSince.mockResolvedValue(10);

    await expect(hasReachedFailedSignInAuditCapQuery('tenant-1', 'user-1', now)).resolves.toEqual({
      success: true,
      data: true,
    });
  });
});
