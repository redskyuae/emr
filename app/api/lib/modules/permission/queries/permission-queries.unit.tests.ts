import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { permissionRepository } from '../repository/permission-repository';
import { getPermissionByIdQuery } from './get-permission-by-id-query';
import { getPermissionsQuery } from './get-permissions-query';

vi.mock('../repository/permission-repository', () => ({
  permissionRepository: {
    getPermissionById: vi.fn(),
    getPermissions: vi.fn(),
  },
}));

const repo = vi.mocked(permissionRepository);
const makePermission = (overrides: Partial<typeof base> = {}) => ({ ...base, ...overrides });
const base = {
  id: 1,
  name: 'roles.read',
  module: 'identity-access',
  action: 'read',
  resource: 'roles',
  isActive: true,
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Permission queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getPermissionById.mockResolvedValue(base);
    repo.getPermissions.mockResolvedValue([base]);
  });

  it('should return invalid-id error and not call repository when id is invalid', async () => {
    const result = await getPermissionByIdQuery('abc');
    expect(result).toEqual({ success: false, errors: ['Permission abc is Invalid.'] });
    expect(repo.getPermissionById).not.toHaveBeenCalled();
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getPermissionByIdQuery('1')).resolves.toEqual({ success: true, data: base });
    expect(repo.getPermissionById).toHaveBeenCalledWith(1);
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    repo.getPermissionById.mockResolvedValue(undefined);
    const result = await getPermissionByIdQuery('1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should group permissions by module and project list items', async () => {
    repo.getPermissions.mockResolvedValue([
      makePermission({ id: 1, module: 'identity-access', name: 'roles.read', resource: 'roles' }),
      makePermission({ id: 2, module: 'identity-access', name: 'roles.write', resource: 'roles' }),
      makePermission({ id: 3, module: 'assets', name: 'assets.read', resource: 'assets' }),
    ]);
    const result = await getPermissionsQuery();
    expect(result).toEqual({
      success: true,
      data: {
        'identity-access': [
          { id: 1, name: 'roles.read', resource: 'roles', action: 'read', description: null },
          { id: 2, name: 'roles.write', resource: 'roles', action: 'read', description: null },
        ],
        assets: [
          { id: 3, name: 'assets.read', resource: 'assets', action: 'read', description: null },
        ],
      },
    });
  });

  it('should pass the module filter through to the repository', async () => {
    await getPermissionsQuery({ module: 'assets' });
    expect(repo.getPermissions).toHaveBeenCalledWith({ module: 'assets' });
  });

  it('should return an internal error when the repository throws', async () => {
    repo.getPermissions.mockRejectedValue(new Error('boom'));
    const result = await getPermissionsQuery();
    expect(result).toEqual({
      success: false,
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      errors: ['boom'],
    });
  });
});
