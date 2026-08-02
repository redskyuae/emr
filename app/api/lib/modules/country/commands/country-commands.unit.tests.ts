import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { countryRepository } from '../repository/country-repository';
import { createCountryCommand } from './create-country-command';
import { deleteCountryCommand } from './delete-country-command';
import { updateCountryCommand } from './update-country-command';

vi.mock('../repository/country-repository', () => ({
  countryRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getCountryById: vi.fn(),
    createCountry: vi.fn(),
    updateCountry: vi.fn(),
    deleteCountry: vi.fn(),
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

describe('Country commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getCountryById.mockResolvedValue(country);
    repo.createCountry.mockResolvedValue(country);
    repo.updateCountry.mockResolvedValue(country);
    repo.deleteCountry.mockResolvedValue(country);
  });

  it('should return schema validation failure and not write when create payload is invalid', async () => {
    const result = await createCountryCommand({});
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Country name is required']),
    });
    expect(repo.createCountry).not.toHaveBeenCalled();
  });

  it('should return conflict when create name already exists', async () => {
    repo.findActiveByName.mockResolvedValue(country);
    const result = await createCountryCommand({ name: 'India', code: 'IND' });
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Country name India already exists.'],
    });
    expect(repo.createCountry).not.toHaveBeenCalled();
  });

  it('should return conflict when create code already exists', async () => {
    repo.findActiveByCode.mockResolvedValue(country);
    const result = await createCountryCommand({ name: 'India', code: 'IND' });
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Country code IND already exists.'],
    });
  });

  it('should create and return data on success', async () => {
    await expect(createCountryCommand({ name: 'India', code: 'ind' })).resolves.toEqual({
      success: true,
      data: country,
    });
    expect(repo.createCountry).toHaveBeenCalledWith({ name: 'India', code: 'IND' });
  });

  it('should map a Drizzle-wrapped 23505 on create to a conflict error', async () => {
    repo.createCountry.mockRejectedValue(
      new Error('insert failed', { cause: { code: '23505', constraint: 'country_name_idx' } })
    );
    await expect(createCountryCommand({ name: 'India', code: 'IND' })).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Country name India already exists.'],
    });
  });

  it('should map an unwrapped 23505 on create to a conflict error', async () => {
    repo.createCountry.mockRejectedValue({ code: '23505', constraint: 'country_code_idx' });
    await expect(createCountryCommand({ name: 'India', code: 'IND' })).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Country code IND already exists.'],
    });
  });

  it('should rethrow unknown create errors', async () => {
    const error = new Error('database down');
    repo.createCountry.mockRejectedValue(error);
    await expect(createCountryCommand({ name: 'India', code: 'IND' })).rejects.toThrow(error);
  });

  it('should return invalid-id error when updating with a bad id', async () => {
    const result = await updateCountryCommand('abc', { name: 'India', code: 'IND' });
    expect(result).toEqual({ success: false, errors: ['Country abc is Invalid.'] });
    expect(repo.getCountryById).not.toHaveBeenCalled();
  });

  it('should return not found when updating a country that does not exist', async () => {
    repo.getCountryById.mockResolvedValue(undefined);
    const result = await updateCountryCommand('1', { name: 'India', code: 'IND' });
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return conflict when update name already exists', async () => {
    repo.findActiveByName.mockResolvedValue({ ...country, id: 2 });
    const result = await updateCountryCommand('1', { name: 'India', code: 'IND' });
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Country name India already exists.'],
    });
    expect(repo.findActiveByName).toHaveBeenCalledWith('India', { excludeId: 1 });
  });

  it('should update and return data on success', async () => {
    await expect(updateCountryCommand('1', { name: 'India', code: 'IND' })).resolves.toEqual({
      success: true,
      data: country,
    });
  });

  it('should return invalid-id error when deleting with a bad id', async () => {
    const result = await deleteCountryCommand('abc');
    expect(result).toEqual({ success: false, errors: ['Country abc is Invalid.'] });
    expect(repo.deleteCountry).not.toHaveBeenCalled();
  });

  it('should return not found when deleting a country that does not exist', async () => {
    repo.deleteCountry.mockResolvedValue(undefined);
    const result = await deleteCountryCommand('1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should delete and return data on success', async () => {
    await expect(deleteCountryCommand('1')).resolves.toEqual({ success: true, data: country });
  });
});
