import { beforeEach, describe, expect, it, vi } from 'vitest';

import { languageRepository } from '../repository/language-repository';
import { getLanguagesQuery } from './get-languages-query';
import { getLanguageByIdQuery } from './get-language-by-id-query';

vi.mock('../repository/language-repository', () => ({
  languageRepository: {
    getLanguageById: vi.fn(),
    getLanguages: vi.fn(),
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

describe('Language queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getLanguageById.mockResolvedValue(language);
    repo.getLanguages.mockResolvedValue({ data: [language], total: 1 });
  });

  it('should return invalid-id error and not call repository when id is invalid', async () => {
    const result = await getLanguageByIdQuery('abc');
    expect(result).toEqual({ success: false, errors: ['LanguageId abc is Invalid.'] });
    expect(repo.getLanguageById).not.toHaveBeenCalled();
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getLanguageByIdQuery('1')).resolves.toEqual({ success: true, data: language });
    expect(repo.getLanguageById).toHaveBeenCalledWith(1);
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    repo.getLanguageById.mockResolvedValue(undefined);
    const result = await getLanguageByIdQuery('1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should return list data and total for list query', async () => {
    await expect(getLanguagesQuery({ page: 2, limit: 5, query: 'in' })).resolves.toEqual({
      success: true,
      data: [language],
      total: 1,
    });
    expect(repo.getLanguages).toHaveBeenCalledWith({ page: 2, limit: 5, query: 'in' });
  });

  it('should default paging params for the list query', async () => {
    await getLanguagesQuery();
    expect(repo.getLanguages).toHaveBeenCalledWith({ page: 1, limit: 10, query: undefined });
  });
});
