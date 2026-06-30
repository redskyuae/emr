import { beforeEach, describe, expect, it, vi } from 'vitest';

import { countryRepository } from '../repository/country-repository';
import { getCountriesQuery } from './get-countries-query';
import { getCountryByIdQuery } from './get-country-by-id-query';

vi.mock('../repository/country-repository', () => ({
  countryRepository: {
    getCountryById: vi.fn(),
    getCountries: vi.fn(),
  },
}));

const repo = vi.mocked(countryRepository);
const country = {
  id: 1,
  name: 'India',
  code: 'IND',
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Country queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getCountryById.mockResolvedValue(country);
    repo.getCountries.mockResolvedValue({ data: [country], total: 1 });
  });

  it('should return invalid-id error and not call repository when id is invalid', async () => {
    const result = await getCountryByIdQuery('abc');
    expect(result).toEqual({ success: false, errors: ['Country abc is Invalid.'] });
    expect(repo.getCountryById).not.toHaveBeenCalled();
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getCountryByIdQuery('1')).resolves.toEqual({ success: true, data: country });
    expect(repo.getCountryById).toHaveBeenCalledWith(1);
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    repo.getCountryById.mockResolvedValue(undefined);
    const result = await getCountryByIdQuery('1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should return list data and total for list query', async () => {
    await expect(getCountriesQuery({ page: 2, limit: 5, query: 'in' })).resolves.toEqual({
      success: true,
      data: [country],
      total: 1,
    });
    expect(repo.getCountries).toHaveBeenCalledWith({ page: 2, limit: 5, query: 'in' });
  });

  it('should default paging params for the list query', async () => {
    await getCountriesQuery();
    expect(repo.getCountries).toHaveBeenCalledWith({ page: 1, limit: 10, query: undefined });
  });
});
