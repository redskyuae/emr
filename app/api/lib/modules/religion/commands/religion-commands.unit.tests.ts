import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { religionRepository } from '../repository/religion-repository';
import { createReligionCommand } from './create-religion-command';
import { deleteReligionCommand } from './delete-religion-command';
import { updateReligionCommand } from './update-religion-command';

vi.mock('../repository/religion-repository', () => ({
  religionRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getReligionById: vi.fn(),
    createReligion: vi.fn(),
    updateReligion: vi.fn(),
    deleteReligion: vi.fn(),
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

describe('Religion commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getReligionById.mockResolvedValue(religion);
    repo.createReligion.mockResolvedValue(religion);
    repo.updateReligion.mockResolvedValue(religion);
    repo.deleteReligion.mockResolvedValue(religion);
  });

  it('should return schema validation failure and not write when create payload is invalid', async () => {
    const result = await createReligionCommand({});
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Religion name is required']),
    });
    expect(repo.createReligion).not.toHaveBeenCalled();
  });

  it('should return conflict when create name already exists', async () => {
    repo.findActiveByName.mockResolvedValue(religion);
    const result = await createReligionCommand({ name: 'Hindu', code: 'HIN' });
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Religion name Hindu already exists.'],
    });
    expect(repo.createReligion).not.toHaveBeenCalled();
  });

  it('should return conflict when create code already exists', async () => {
    repo.findActiveByCode.mockResolvedValue(religion);
    const result = await createReligionCommand({ name: 'Hindu', code: 'HIN' });
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Religion code HIN already exists.'],
    });
  });

  it('should create and return data on success', async () => {
    await expect(createReligionCommand({ name: 'Hindu', code: 'hin' })).resolves.toEqual({
      success: true,
      data: religion,
    });
    expect(repo.createReligion).toHaveBeenCalledWith({ name: 'Hindu', code: 'HIN' });
  });

  it('should map a Drizzle-wrapped 23505 on create to a conflict error', async () => {
    repo.createReligion.mockRejectedValue(
      new Error('insert failed', { cause: { code: '23505', constraint: 'religion_name_idx' } })
    );
    await expect(createReligionCommand({ name: 'Hindu', code: 'HIN' })).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Religion name Hindu already exists.'],
    });
  });

  it('should map an unwrapped 23505 on create to a conflict error', async () => {
    repo.createReligion.mockRejectedValue({ code: '23505', constraint: 'religion_code_idx' });
    await expect(createReligionCommand({ name: 'Hindu', code: 'HIN' })).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Religion code HIN already exists.'],
    });
  });

  it('should rethrow unknown create errors', async () => {
    const error = new Error('database down');
    repo.createReligion.mockRejectedValue(error);
    await expect(createReligionCommand({ name: 'Hindu', code: 'HIN' })).rejects.toThrow(error);
  });

  it('should return invalid-id error when updating with a bad id', async () => {
    const result = await updateReligionCommand('abc', { name: 'Hindu', code: 'HIN' });
    expect(result).toEqual({ success: false, errors: ['Religion abc is Invalid.'] });
    expect(repo.getReligionById).not.toHaveBeenCalled();
  });

  it('should return not found when updating a religion that does not exist', async () => {
    repo.getReligionById.mockResolvedValue(undefined);
    const result = await updateReligionCommand('1', { name: 'Hindu', code: 'HIN' });
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return conflict when update name already exists', async () => {
    repo.findActiveByName.mockResolvedValue({ ...religion, id: 2 });
    const result = await updateReligionCommand('1', { name: 'Hindu', code: 'HIN' });
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Religion name Hindu already exists.'],
    });
    expect(repo.findActiveByName).toHaveBeenCalledWith('Hindu', { excludeId: 1 });
  });

  it('should update and return data on success', async () => {
    await expect(updateReligionCommand('1', { name: 'Hindu', code: 'HIN' })).resolves.toEqual({
      success: true,
      data: religion,
    });
  });

  it('should return invalid-id error when deleting with a bad id', async () => {
    const result = await deleteReligionCommand('abc');
    expect(result).toEqual({ success: false, errors: ['Religion abc is Invalid.'] });
    expect(repo.deleteReligion).not.toHaveBeenCalled();
  });

  it('should return not found when deleting a religion that does not exist', async () => {
    repo.deleteReligion.mockResolvedValue(undefined);
    const result = await deleteReligionCommand('1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should delete and return data on success', async () => {
    await expect(deleteReligionCommand('1')).resolves.toEqual({ success: true, data: religion });
  });
});
