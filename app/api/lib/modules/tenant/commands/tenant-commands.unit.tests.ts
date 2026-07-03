import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tenantRepository } from '../repository/tenant-repository';
import { validateTenantOwnerAccess } from '../validator/tenant-access-validator';
import { validateUpdateTenant } from '../validator/update-tenant-validator';
import { deactivateTenantCommand } from './deactivate-tenant-command';
import { reactivateTenantCommand } from './reactivate-tenant-command';
import { updateTenantCommand } from './update-tenant-command';

vi.mock('../repository/tenant-repository', () => ({
  tenantRepository: {
    updateTenant: vi.fn(),
    setTenantActive: vi.fn(),
  },
}));
vi.mock('../validator/update-tenant-validator', () => ({ validateUpdateTenant: vi.fn() }));
vi.mock('../validator/tenant-access-validator', () => ({ validateTenantOwnerAccess: vi.fn() }));

const repo = vi.mocked(tenantRepository);
const validateUpdate = vi.mocked(validateUpdateTenant);
const validateOwner = vi.mocked(validateTenantOwnerAccess);
const tenant = {
  id: 'org-1',
  name: 'Apollo',
  slug: 'apollo',
  createdAt: new Date(),
  isActive: true,
  logo: null,
};

describe('Tenant commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 'org-1', payload: { name: 'New Name' } },
    });
    validateOwner.mockResolvedValue({ success: true, data: { id: 'org-1', userId: 'user-1' } });
    repo.updateTenant.mockResolvedValue(tenant);
    repo.setTenantActive.mockResolvedValue(tenant);
  });

  it('should return validation failure and not write when the update validator fails', async () => {
    validateUpdate.mockResolvedValue({ success: false, errors: ['Forbidden'], status: 403 });
    const result = await updateTenantCommand('org-1', {}, 'user-1');
    expect(result).toEqual({ success: false, errors: ['Forbidden'], status: 403 });
    expect(repo.updateTenant).not.toHaveBeenCalled();
  });

  it('should update the tenant on success', async () => {
    await expect(updateTenantCommand('org-1', {}, 'user-1')).resolves.toEqual({
      success: true,
      data: tenant,
    });
    expect(repo.updateTenant).toHaveBeenCalledWith('org-1', { name: 'New Name' });
  });

  it('should return not found when the update repository reports no row', async () => {
    repo.updateTenant.mockResolvedValue(undefined);
    await expect(updateTenantCommand('org-1', {}, 'user-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should map a duplicate name constraint to a conflict error', async () => {
    repo.updateTenant.mockRejectedValue({ constraint: 'organization_name_idx' });
    await expect(updateTenantCommand('org-1', {}, 'user-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['A tenant with this name already exists.'],
    });
  });

  it('should deactivate the tenant on success', async () => {
    await expect(deactivateTenantCommand('org-1', 'user-1')).resolves.toEqual({
      success: true,
      data: tenant,
    });
    expect(repo.setTenantActive).toHaveBeenCalledWith('org-1', false);
  });

  it('should return forbidden when deactivation owner access fails', async () => {
    validateOwner.mockResolvedValue({
      success: false,
      errors: ['Tenant owner access required'],
      status: StatusCodes.FORBIDDEN,
    });
    await expect(deactivateTenantCommand('org-1', 'user-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.FORBIDDEN,
    });
    expect(repo.setTenantActive).not.toHaveBeenCalled();
  });

  it('should reactivate the tenant on success', async () => {
    await expect(reactivateTenantCommand('org-1', 'user-1')).resolves.toEqual({
      success: true,
      data: tenant,
    });
    expect(repo.setTenantActive).toHaveBeenCalledWith('org-1', true);
  });

  it('should return not found when reactivation finds no row', async () => {
    repo.setTenantActive.mockResolvedValue(undefined);
    await expect(reactivateTenantCommand('org-1', 'user-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });
});
