import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tenantRepository } from '../repository/tenant-repository';
import { validateTenantMemberAccess, validateTenantOwnerAccess } from './tenant-access-validator';
import {
  getTenantUniqueConstraintErrors,
  validateTenantUniqueness,
} from './tenant-uniqueness-validator';
import { validateUpdateTenant } from './update-tenant-validator';

vi.mock('../repository/tenant-repository', () => ({
  tenantRepository: {
    getTenantById: vi.fn(),
    isTenantMember: vi.fn(),
    isTenantOwner: vi.fn(),
    findTenantByName: vi.fn(),
    findTenantBySlug: vi.fn(),
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
  timeZone: 'Asia/Kolkata',
  isOnboarded: true,
};

describe('Tenant validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getTenantById.mockResolvedValue(tenant);
    repo.isTenantMember.mockResolvedValue(true);
    repo.isTenantOwner.mockResolvedValue(true);
    repo.findTenantByName.mockResolvedValue(undefined);
    repo.findTenantBySlug.mockResolvedValue(undefined);
  });

  it('should return not found when the tenant does not exist', async () => {
    repo.getTenantById.mockResolvedValue(undefined);
    const result = await validateTenantMemberAccess('org-1', 'user-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return forbidden when the user is not a member', async () => {
    repo.isTenantMember.mockResolvedValue(false);
    const result = await validateTenantMemberAccess('org-1', 'user-1');
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.FORBIDDEN,
      errors: ['Tenant access required'],
    });
  });

  it('should grant member access to a member', async () => {
    await expect(validateTenantMemberAccess('org-1', 'user-1')).resolves.toEqual({
      success: true,
      data: { id: 'org-1', userId: 'user-1' },
    });
  });

  it('should return forbidden when the user is not an owner', async () => {
    repo.isTenantOwner.mockResolvedValue(false);
    const result = await validateTenantOwnerAccess('org-1', 'user-1');
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.FORBIDDEN,
      errors: ['Tenant owner access required'],
    });
  });

  it('should flag a duplicate tenant name and slug', async () => {
    repo.findTenantByName.mockResolvedValue(tenant);
    repo.findTenantBySlug.mockResolvedValue(tenant);
    const result = await validateTenantUniqueness({ name: 'Apollo', slug: 'apollo' });
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: [
        'A tenant with this name already exists.',
        'A tenant with this slug already exists.',
      ],
    });
  });

  it('should pass uniqueness when nothing matches', async () => {
    await expect(validateTenantUniqueness({ name: 'Apollo' })).resolves.toMatchObject({
      success: true,
    });
  });

  it('should reject an update payload with no fields', async () => {
    const result = await validateUpdateTenant('org-1', {}, 'user-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['At least one tenant field is required']),
    });
  });

  it('should return id and payload on update success', async () => {
    const result = await validateUpdateTenant('org-1', { name: 'New Name' }, 'user-1');
    expect(result).toEqual({
      success: true,
      data: { id: 'org-1', payload: { name: 'New Name' } },
    });
  });

  it('should map known constraint errors to friendly messages', () => {
    expect(getTenantUniqueConstraintErrors({ constraint: 'organization_name_idx' })).toEqual([
      'A tenant with this name already exists.',
    ]);
    expect(getTenantUniqueConstraintErrors({ constraint: 'organization_slug_uidx' })).toEqual([
      'A tenant with this slug already exists.',
    ]);
    expect(
      getTenantUniqueConstraintErrors({ cause: { message: 'Organization already exists' } })
    ).toEqual(['A tenant with this slug already exists.']);
    expect(getTenantUniqueConstraintErrors({ constraint: 'other' })).toEqual([]);
  });
});
