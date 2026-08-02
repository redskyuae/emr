import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { languageRepository } from '../repository/language-repository';
import { createLanguageCommand } from './create-language-command';
import { deleteLanguageCommand } from './delete-language-command';
import { updateLanguageCommand } from './update-language-command';

vi.mock('../repository/language-repository', () => ({
  languageRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getLanguageById: vi.fn(),
    createLanguage: vi.fn(),
    updateLanguage: vi.fn(),
    deleteLanguage: vi.fn(),
  },
}));

const repo = vi.mocked(languageRepository);
const language = {
  id: 1,
  name: 'English',
  code: 'EN',
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Language commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getLanguageById.mockResolvedValue(language);
    repo.createLanguage.mockResolvedValue(language);
    repo.updateLanguage.mockResolvedValue(language);
    repo.deleteLanguage.mockResolvedValue(language);
  });

  it('should return schema validation failure and not write when create payload is invalid', async () => {
    const result = await createLanguageCommand({});
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Language name is required']),
    });
    expect(repo.createLanguage).not.toHaveBeenCalled();
  });

  it('should return conflict when create name already exists', async () => {
    repo.findActiveByName.mockResolvedValue(language);
    const result = await createLanguageCommand({ name: 'English', code: 'EN' });
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Language name English already exists.'],
    });
    expect(repo.createLanguage).not.toHaveBeenCalled();
  });

  it('should return conflict when create code already exists', async () => {
    repo.findActiveByCode.mockResolvedValue(language);
    const result = await createLanguageCommand({ name: 'English', code: 'EN' });
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Language code EN already exists.'],
    });
  });

  it('should create and return data on success', async () => {
    await expect(createLanguageCommand({ name: 'English', code: 'en' })).resolves.toEqual({
      success: true,
      data: language,
    });
    expect(repo.createLanguage).toHaveBeenCalledWith({ name: 'English', code: 'EN' });
  });

  it('should map a Drizzle-wrapped 23505 on create to a conflict error', async () => {
    repo.createLanguage.mockRejectedValue(
      new Error('insert failed', { cause: { code: '23505', constraint: 'language_name_idx' } })
    );
    await expect(createLanguageCommand({ name: 'English', code: 'EN' })).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Language name English already exists.'],
    });
  });

  it('should map an unwrapped 23505 on create to a conflict error', async () => {
    repo.createLanguage.mockRejectedValue({ code: '23505', constraint: 'language_code_idx' });
    await expect(createLanguageCommand({ name: 'English', code: 'EN' })).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Language code EN already exists.'],
    });
  });

  it('should rethrow unknown create errors', async () => {
    const error = new Error('database down');
    repo.createLanguage.mockRejectedValue(error);
    await expect(createLanguageCommand({ name: 'English', code: 'EN' })).rejects.toThrow(error);
  });

  it('should return invalid-id error when updating with a bad id', async () => {
    const result = await updateLanguageCommand('abc', { name: 'English', code: 'EN' });
    expect(result).toEqual({ success: false, errors: ['LanguageId abc is Invalid.'] });
    expect(repo.getLanguageById).not.toHaveBeenCalled();
  });

  it('should return not found when updating a language that does not exist', async () => {
    repo.getLanguageById.mockResolvedValue(undefined);
    const result = await updateLanguageCommand('1', { name: 'English', code: 'EN' });
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return conflict when update name already exists', async () => {
    repo.findActiveByName.mockResolvedValue({ ...language, id: 2 });
    const result = await updateLanguageCommand('1', { name: 'English', code: 'EN' });
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Language name English already exists.'],
    });
    expect(repo.findActiveByName).toHaveBeenCalledWith('English', { excludeId: 1 });
  });

  it('should update and return data on success', async () => {
    await expect(updateLanguageCommand('1', { name: 'English', code: 'EN' })).resolves.toEqual({
      success: true,
      data: language,
    });
  });

  it('should return invalid-id error when deleting with a bad id', async () => {
    const result = await deleteLanguageCommand('abc');
    expect(result).toEqual({ success: false, errors: ['LanguageId abc is Invalid.'] });
    expect(repo.deleteLanguage).not.toHaveBeenCalled();
  });

  it('should return not found when deleting a language that does not exist', async () => {
    repo.deleteLanguage.mockResolvedValue(undefined);
    const result = await deleteLanguageCommand('1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should delete and return data on success', async () => {
    await expect(deleteLanguageCommand('1')).resolves.toEqual({ success: true, data: language });
  });
});
