import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { validateTenantOnboarding } from './tenant-onboarding-validator';

vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: {
    getTenantById: vi.fn(),
  },
}));

const repo = vi.mocked(tenantRepository);
const tenant = {
  id: 'org-1',
  name: 'Apollo',
  slug: 'apollo',
  createdAt: new Date(),
  isActive: true,
  logo: null,
  isOnboarded: false,
};

describe('TenantOnboarding validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getTenantById.mockResolvedValue(tenant);
  });

  it('should fail schema validation and skip the repository when the tenant id is missing', async () => {
    const result = await validateTenantOnboarding(undefined);

    expect(result).toMatchObject({ success: false, errors: ['Tenant ID is required'] });
    expect(repo.getTenantById).not.toHaveBeenCalled();
  });

  it('should fail schema validation and skip the repository when the tenant id is blank', async () => {
    const result = await validateTenantOnboarding('   ');

    expect(result).toMatchObject({ success: false });
    expect(repo.getTenantById).not.toHaveBeenCalled();
  });

  it('should return not found when the tenant does not exist', async () => {
    repo.getTenantById.mockResolvedValue(undefined);

    const result = await validateTenantOnboarding('org-missing');

    expect(result).toMatchObject({
      success: false,
      errors: ['Tenant not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should return the tenant for a valid (trimmed) tenant id', async () => {
    await expect(validateTenantOnboarding(' org-1 ')).resolves.toEqual({
      success: true,
      data: tenant,
    });
    expect(repo.getTenantById).toHaveBeenCalledWith('org-1');
  });
});
