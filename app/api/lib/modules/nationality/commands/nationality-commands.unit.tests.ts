import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { nationalityRepository } from '../repository/nationality-repository';
import { createNationalityCommand } from './create-nationality-command';
import { deleteNationalityCommand } from './delete-nationality-command';
import { updateNationalityCommand } from './update-nationality-command';

vi.mock('../repository/nationality-repository', () => ({
  nationalityRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getNationalityById: vi.fn(),
    createNationality: vi.fn(),
    updateNationality: vi.fn(),
    deleteNationality: vi.fn(),
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

describe('Nationality commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getNationalityById.mockResolvedValue(nationality);
    repo.createNationality.mockResolvedValue(nationality);
    repo.updateNationality.mockResolvedValue(nationality);
    repo.deleteNationality.mockResolvedValue(nationality);
  });

  it('should return schema validation failure and not write when create payload is invalid', async () => {
    const result = await createNationalityCommand({});
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Nationality name is required']),
    });
    expect(repo.createNationality).not.toHaveBeenCalled();
  });

  it('should return conflict when create name already exists', async () => {
    repo.findActiveByName.mockResolvedValue(nationality);
    const result = await createNationalityCommand({ name: 'Indian', code: 'IND' });
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Nationality name Indian already exists'],
    });
    expect(repo.createNationality).not.toHaveBeenCalled();
  });

  it('should return conflict when create code already exists', async () => {
    repo.findActiveByCode.mockResolvedValue(nationality);
    const result = await createNationalityCommand({ name: 'Indian', code: 'IND' });
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Nationality code IND already exists'],
    });
  });

  it('should create and return data on success', async () => {
    await expect(createNationalityCommand({ name: 'Indian', code: 'ind' })).resolves.toEqual({
      success: true,
      data: nationality,
    });
    expect(repo.createNationality).toHaveBeenCalledWith({ name: 'Indian', code: 'IND' });
  });

  it('should map a unique constraint 23505 on create to a conflict error', async () => {
    repo.createNationality.mockRejectedValue({ code: '23505', constraint: 'nationality_name_idx' });
    await expect(createNationalityCommand({ name: 'Indian', code: 'IND' })).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Nationality name Indian already exists.'],
    });
  });

  it('should rethrow unknown create errors', async () => {
    const error = new Error('database down');
    repo.createNationality.mockRejectedValue(error);
    await expect(createNationalityCommand({ name: 'Indian', code: 'IND' })).rejects.toThrow(error);
  });

  it('should return invalid-id error when updating with a bad id', async () => {
    const result = await updateNationalityCommand('abc', { name: 'Indian', code: 'IND' });
    expect(result).toEqual({ success: false, errors: ['NationalityId abc is Invalid'] });
    expect(repo.getNationalityById).not.toHaveBeenCalled();
  });

  it('should return not found when updating a nationality that does not exist', async () => {
    repo.getNationalityById.mockResolvedValue(undefined);
    const result = await updateNationalityCommand('1', { name: 'Indian', code: 'IND' });
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return conflict when update name already exists', async () => {
    repo.findActiveByName.mockResolvedValue({ ...nationality, id: 2 });
    const result = await updateNationalityCommand('1', { name: 'Indian', code: 'IND' });
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Nationality name Indian already exists.'],
    });
    expect(repo.findActiveByName).toHaveBeenCalledWith('Indian', { excludeId: 1 });
  });

  it('should update and return data on success', async () => {
    await expect(updateNationalityCommand('1', { name: 'Indian', code: 'IND' })).resolves.toEqual({
      success: true,
      data: nationality,
    });
  });

  it('should return invalid-id error when deleting with a bad id', async () => {
    const result = await deleteNationalityCommand('abc');
    expect(result).toEqual({ success: false, errors: ['NationalityId abc is Invalid'] });
    expect(repo.deleteNationality).not.toHaveBeenCalled();
  });

  it('should return not found when deleting a nationality that does not exist', async () => {
    repo.deleteNationality.mockResolvedValue(undefined);
    const result = await deleteNationalityCommand('1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should delete and return data on success', async () => {
    await expect(deleteNationalityCommand('1')).resolves.toEqual({
      success: true,
      data: nationality,
    });
  });
});
