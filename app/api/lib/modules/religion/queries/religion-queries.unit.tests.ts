import { beforeEach, describe, expect, it, vi } from 'vitest';

import { religionRepository } from '../repository/religion-repository';
import { getReligionsQuery } from './get-religions-query';
import { getReligionByIdQuery } from './get-religion-by-id-query';

vi.mock('../repository/religion-repository', () => ({
  religionRepository: {
    getReligionById: vi.fn(),
    getReligions: vi.fn(),
  },
}));

const repo = vi.mocked(religionRepository);
const religion = {
  id: 1,
  name: 'Hindu',
  code: 'HIN',
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Religion queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getReligionById.mockResolvedValue(religion);
    repo.getReligions.mockResolvedValue({ data: [religion], total: 1 });
  });

  it('should return invalid-id error and not call repository when id is invalid', async () => {
    const result = await getReligionByIdQuery('abc');
    expect(result).toEqual({ success: false, errors: ['Religion abc is Invalid.'] });
    expect(repo.getReligionById).not.toHaveBeenCalled();
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getReligionByIdQuery('1')).resolves.toEqual({ success: true, data: religion });
    expect(repo.getReligionById).toHaveBeenCalledWith(1);
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    repo.getReligionById.mockResolvedValue(undefined);
    const result = await getReligionByIdQuery('1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should return list data and total for list query', async () => {
    await expect(getReligionsQuery({ page: 2, limit: 5, query: 'in' })).resolves.toEqual({
      success: true,
      data: [religion],
      total: 1,
    });
    expect(repo.getReligions).toHaveBeenCalledWith({ page: 2, limit: 5, query: 'in' });
  });

  it('should default paging params for the list query', async () => {
    await getReligionsQuery();
    expect(repo.getReligions).toHaveBeenCalledWith({ page: 1, limit: 10, query: undefined });
  });
});
