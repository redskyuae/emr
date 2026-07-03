import { beforeEach, describe, expect, it, vi } from 'vitest';

import { nationalityRepository } from '../repository/nationality-repository';
import { getNationalitiesQuery } from './get-nationalities-query';
import { getNationalityByIdQuery } from './get-nationality-by-id-query';

vi.mock('../repository/nationality-repository', () => ({
  nationalityRepository: {
    getNationalityById: vi.fn(),
    getNationalities: vi.fn(),
  },
}));

const repo = vi.mocked(nationalityRepository);
const nationality = {
  id: 1,
  name: 'Indian',
  code: 'IND',
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Nationality queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getNationalityById.mockResolvedValue(nationality);
    repo.getNationalities.mockResolvedValue({ data: [nationality], total: 1 });
  });

  it('should return invalid-id error and not call repository when id is invalid', async () => {
    const result = await getNationalityByIdQuery('abc');
    expect(result).toEqual({ success: false, errors: ['NationalityId abc is Invalid'] });
    expect(repo.getNationalityById).not.toHaveBeenCalled();
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getNationalityByIdQuery('1')).resolves.toEqual({
      success: true,
      data: nationality,
    });
    expect(repo.getNationalityById).toHaveBeenCalledWith(1);
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    repo.getNationalityById.mockResolvedValue(undefined);
    const result = await getNationalityByIdQuery('1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should return list data and total for list query', async () => {
    await expect(getNationalitiesQuery({ page: 2, limit: 5, query: 'in' })).resolves.toEqual({
      success: true,
      data: [nationality],
      total: 1,
    });
    expect(repo.getNationalities).toHaveBeenCalledWith({ page: 2, limit: 5, query: 'in' });
  });

  it('should default paging params for the list query', async () => {
    await getNationalitiesQuery();
    expect(repo.getNationalities).toHaveBeenCalledWith({ page: 1, limit: 10, query: undefined });
  });
});
