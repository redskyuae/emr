import { beforeEach, describe, expect, it, vi } from 'vitest';

import { admitSourceRepository } from '../repository/admit-source-repository';
import { validateGetAdmitSourceById } from '../validator/get-admit-source-by-id-validator';
import { getAdmitSourceByIdQuery } from './get-admit-source-by-id-query';
import { getAdmitSourcesQuery } from './get-admit-sources-query';

vi.mock('../repository/admit-source-repository', () => ({
  admitSourceRepository: { getAdmitSourceById: vi.fn(), getAdmitSources: vi.fn() },
}));
vi.mock('../validator/get-admit-source-by-id-validator', () => ({
  validateGetAdmitSourceById: vi.fn(),
}));

const repo = vi.mocked(admitSourceRepository);
const validateById = vi.mocked(validateGetAdmitSourceById);

const admitSource = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Doctor Referral',
  code: 'DOCREF',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AdmitSource queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.getAdmitSourceById.mockResolvedValue(admitSource);
    repo.getAdmitSources.mockResolvedValue({ data: [admitSource], total: 1 });
  });

  describe('getAdmitSourceByIdQuery', () => {
    it('should short-circuit and not call the repository when validation fails', async () => {
      validateById.mockReturnValue({ success: false, errors: ['Admit source abc is Invalid.'] });

      await expect(getAdmitSourceByIdQuery('abc', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Admit source abc is Invalid.'],
      });
      expect(repo.getAdmitSourceById).not.toHaveBeenCalled();
    });

    it('should return not found when the row is missing', async () => {
      repo.getAdmitSourceById.mockResolvedValue(undefined);

      await expect(getAdmitSourceByIdQuery('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: 404,
      });
    });

    it('should return the admit source on success', async () => {
      await expect(getAdmitSourceByIdQuery('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: admitSource,
      });
      expect(repo.getAdmitSourceById).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });

  describe('getAdmitSourcesQuery', () => {
    it('should short-circuit and not call the repository when the tenant id is blank', async () => {
      const result = await getAdmitSourcesQuery({ tenantId: '  ' });

      expect(result.success).toBe(false);
      expect(repo.getAdmitSources).not.toHaveBeenCalled();
    });

    it('should pass paging and search params through to the repository', async () => {
      await getAdmitSourcesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'docref' });

      expect(repo.getAdmitSources).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        page: 2,
        limit: 5,
        query: 'docref',
      });
    });

    it('should return the list query result shape', async () => {
      await expect(getAdmitSourcesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
        success: true,
        data: [admitSource],
        total: 1,
      });
    });
  });
});
