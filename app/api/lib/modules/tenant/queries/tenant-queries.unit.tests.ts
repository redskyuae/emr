import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tenantRepository } from '../repository/tenant-repository';
import { validateTenantMemberAccess } from '../validator/tenant-access-validator';
import { getTenantByIdQuery } from './get-tenant-by-id-query';

vi.mock('../repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));
vi.mock('../validator/tenant-access-validator', () => ({ validateTenantMemberAccess: vi.fn() }));

const repo = vi.mocked(tenantRepository);
const validateMember = vi.mocked(validateTenantMemberAccess);
const tenant = {
  id: 'org-1',
  name: 'Apollo',
  slug: 'apollo',
  createdAt: new Date(),
  isActive: true,
  logo: null,
  isOnboarded: true,
};

describe('Tenant queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateMember.mockResolvedValue({ success: true, data: { id: 'org-1', userId: 'user-1' } });
    repo.getTenantById.mockResolvedValue(tenant);
  });

  it('should return access failure and not call repository when access validation fails', async () => {
    validateMember.mockResolvedValue({
      success: false,
      errors: ['Tenant access required'],
      status: StatusCodes.FORBIDDEN,
    });
    const result = await getTenantByIdQuery('org-1', 'user-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.FORBIDDEN });
    expect(repo.getTenantById).not.toHaveBeenCalled();
  });

  it('should return the tenant on success', async () => {
    await expect(getTenantByIdQuery('org-1', 'user-1')).resolves.toEqual({
      success: true,
      data: tenant,
    });
    expect(repo.getTenantById).toHaveBeenCalledWith('org-1');
  });

  it('should return not found when the repository returns nothing', async () => {
    repo.getTenantById.mockResolvedValue(undefined);
    const result = await getTenantByIdQuery('org-1', 'user-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });
});
