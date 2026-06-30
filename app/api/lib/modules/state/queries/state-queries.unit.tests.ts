import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { countryRepository } from '../../country/repository/country-repository';
import { stateRepository } from '../repository/state-repository';
import { getStateByIdQuery } from './get-state-by-id-query';
import { getStatesQuery } from './get-states-query';

vi.mock('../repository/state-repository', () => ({
  stateRepository: {
    getStateById: vi.fn(),
    getStates: vi.fn(),
  },
}));
vi.mock('../../country/repository/country-repository', () => ({
  countryRepository: {
    getCountryById: vi.fn(),
  },
}));

const stateRepo = vi.mocked(stateRepository);
const countryRepo = vi.mocked(countryRepository);
const country = {
  id: 1,
  name: 'India',
  code: 'IND',
  createdOn: new Date(),
  modifiedOn: new Date(),
};
const state = {
  id: 1,
  name: 'Maharashtra',
  countryId: 1,
  country: { id: 1, name: 'India', code: 'IND' },
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('State queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    countryRepo.getCountryById.mockResolvedValue(country);
    stateRepo.getStateById.mockResolvedValue(state);
    stateRepo.getStates.mockResolvedValue({ data: [state], total: 1 });
  });

  it('should return invalid-id error and not call repository when id is invalid', async () => {
    const result = await getStateByIdQuery('abc');
    expect(result).toEqual({ success: false, errors: ['State abc is Invalid.'] });
    expect(stateRepo.getStateById).not.toHaveBeenCalled();
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getStateByIdQuery('1')).resolves.toEqual({ success: true, data: state });
    expect(stateRepo.getStateById).toHaveBeenCalledWith(1);
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    stateRepo.getStateById.mockResolvedValue(undefined);
    const result = await getStateByIdQuery('1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should return list data without filtering when no country id is provided', async () => {
    await expect(getStatesQuery({ page: 2, limit: 5, query: 'ma' })).resolves.toEqual({
      success: true,
      data: [state],
      total: 1,
    });
    expect(stateRepo.getStates).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      query: 'ma',
      countryId: undefined,
    });
    expect(countryRepo.getCountryById).not.toHaveBeenCalled();
  });

  it('should return validation error when the country id filter is invalid', async () => {
    const result = await getStatesQuery({ countryId: '1' as unknown as number });
    expect(result).toEqual({
      success: false,
      errors: ['countryId: Country ID must be a positive integer'],
    });
    expect(stateRepo.getStates).not.toHaveBeenCalled();
  });

  it('should return bad request when the country id filter references a missing country', async () => {
    countryRepo.getCountryById.mockResolvedValue(undefined);
    const result = await getStatesQuery({ countryId: 99 });
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.BAD_REQUEST,
      errors: ['countryId: Country not found'],
    });
    expect(stateRepo.getStates).not.toHaveBeenCalled();
  });

  it('should return filtered list data when a valid country id is provided', async () => {
    await expect(getStatesQuery({ countryId: 1 })).resolves.toEqual({
      success: true,
      data: [state],
      total: 1,
    });
    expect(stateRepo.getStates).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      query: undefined,
      countryId: 1,
    });
  });
});
