import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { countryRepository } from '../../country/repository/country-repository';
import { stateRepository } from '../repository/state-repository';
import { createStateCommand } from './create-state-command';
import { deleteStateCommand } from './delete-state-command';
import { updateStateCommand } from './update-state-command';

vi.mock('../repository/state-repository', () => ({
  stateRepository: {
    getStateById: vi.fn(),
    findActiveByNameAndCountry: vi.fn(),
    createState: vi.fn(),
    updateState: vi.fn(),
    deleteState: vi.fn(),
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
const payload = { name: 'Maharashtra', countryId: 1 };

describe('State commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    countryRepo.getCountryById.mockResolvedValue(country);
    stateRepo.getStateById.mockResolvedValue(state);
    stateRepo.findActiveByNameAndCountry.mockResolvedValue(undefined);
    stateRepo.createState.mockResolvedValue(state);
    stateRepo.updateState.mockResolvedValue(state);
    stateRepo.deleteState.mockResolvedValue(state);
  });

  it('should return schema validation failure and not write when create payload is invalid', async () => {
    const result = await createStateCommand({});
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['State name is required']),
    });
    expect(stateRepo.createState).not.toHaveBeenCalled();
  });

  it('should return bad request when the referenced country does not exist on create', async () => {
    countryRepo.getCountryById.mockResolvedValue(undefined);
    const result = await createStateCommand(payload);
    expect(result).toEqual({
      success: false,
      status: StatusCodes.BAD_REQUEST,
      errors: ['countryId: Country not found'],
    });
    expect(stateRepo.createState).not.toHaveBeenCalled();
  });

  it('should return conflict when a state with the same name exists for the country', async () => {
    stateRepo.findActiveByNameAndCountry.mockResolvedValue(state);
    const result = await createStateCommand(payload);
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['State name Maharashtra already exists for the selected country.'],
    });
  });

  it('should create and return data on success', async () => {
    await expect(createStateCommand(payload)).resolves.toEqual({ success: true, data: state });
    expect(stateRepo.createState).toHaveBeenCalledWith(payload);
  });

  it('should map a Drizzle-wrapped 23505 on create to a conflict error', async () => {
    stateRepo.createState.mockRejectedValue(
      new Error('insert failed', {
        cause: { code: '23505', constraint: 'state_name_country_idx' },
      })
    );
    await expect(createStateCommand(payload)).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['State name Maharashtra already exists for the selected country.'],
    });
  });

  it('should map an unwrapped 23505 on create to a conflict error', async () => {
    stateRepo.createState.mockRejectedValue({
      code: '23505',
      constraint: 'state_name_country_idx',
    });
    await expect(createStateCommand(payload)).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['State name Maharashtra already exists for the selected country.'],
    });
  });

  it('should rethrow unknown create errors rather than leaking the database message', async () => {
    const error = new Error('database down');
    stateRepo.createState.mockRejectedValue(error);
    await expect(createStateCommand(payload)).rejects.toThrow(error);
  });

  it('should return invalid-id error when updating with a bad id', async () => {
    const result = await updateStateCommand('abc', payload);
    expect(result).toEqual({ success: false, errors: ['State abc is Invalid.'] });
  });

  it('should return not found when updating a state that does not exist', async () => {
    stateRepo.getStateById.mockResolvedValue(undefined);
    const result = await updateStateCommand('1', payload);
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return bad request when the referenced country does not exist on update', async () => {
    countryRepo.getCountryById.mockResolvedValue(undefined);
    const result = await updateStateCommand('1', payload);
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.BAD_REQUEST,
      errors: ['countryId: Country not found'],
    });
  });

  it('should return conflict when update creates a duplicate for the country', async () => {
    stateRepo.findActiveByNameAndCountry.mockResolvedValue({ ...state, id: 2 });
    const result = await updateStateCommand('1', payload);
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['State name Maharashtra already exists for the selected country.'],
    });
    expect(stateRepo.findActiveByNameAndCountry).toHaveBeenCalledWith('Maharashtra', 1, {
      excludeId: 1,
    });
  });

  it('should update and return data on success', async () => {
    await expect(updateStateCommand('1', payload)).resolves.toEqual({ success: true, data: state });
  });

  it('should return invalid-id error when deleting with a bad id', async () => {
    const result = await deleteStateCommand('abc');
    expect(result).toEqual({ success: false, errors: ['State abc is Invalid.'] });
    expect(stateRepo.deleteState).not.toHaveBeenCalled();
  });

  it('should return not found when deleting a state that does not exist', async () => {
    stateRepo.deleteState.mockResolvedValue(undefined);
    const result = await deleteStateCommand('1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should delete and return data on success', async () => {
    await expect(deleteStateCommand('1')).resolves.toEqual({ success: true, data: state });
  });
});
