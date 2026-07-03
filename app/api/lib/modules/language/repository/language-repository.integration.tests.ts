import { describe, expect, it } from 'vitest';

import { languageRepository } from './language-repository';

const createLanguage = (name: string, code: string) =>
  languageRepository.createLanguage({
    name,
    code,
  });

describe('Language repository', () => {
  it('should create language', async () => {
    const created = await createLanguage('English', 'EN');
    expect(created).toMatchObject({
      id: expect.any(Number),
      name: 'English',
      code: 'EN',
    });
  });

  it('should get language by id', async () => {
    const created = await createLanguage('Hindi', 'HI');
    await expect(languageRepository.getLanguageById(created.id)).resolves.toMatchObject({
      id: created.id,
      name: 'Hindi',
    });
  });

  it('should list languages', async () => {
    await createLanguage('English', 'EN');
    await createLanguage('Hindi', 'HI');
    const result = await languageRepository.getLanguages();
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should not list soft-deleted languages', async () => {
    const deleted = await createLanguage('Tamil', 'TA');
    await languageRepository.deleteLanguage(deleted.id);
    await createLanguage('Telugu', 'TE');
    const result = await languageRepository.getLanguages();
    expect(result.data.map((l) => l.code)).toEqual(['TE']);
  });

  it('should soft-delete language and exclude it from future reads', async () => {
    const created = await createLanguage('Kannada', 'KN');
    await expect(languageRepository.deleteLanguage(created.id)).resolves.toMatchObject({
      id: created.id,
    });
    await expect(languageRepository.getLanguageById(created.id)).resolves.toBeUndefined();
  });

  it('should update only active language', async () => {
    const created = await createLanguage('Malayalam', 'ML');
    await expect(
      languageRepository.updateLanguage(created.id, {
        name: 'Malayala',
        code: 'MLA',
      })
    ).resolves.toMatchObject({ name: 'Malayala', code: 'MLA' });
    await languageRepository.deleteLanguage(created.id);
    await expect(
      languageRepository.updateLanguage(created.id, {
        name: 'Malayalam',
        code: 'ML',
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name', async () => {
    await createLanguage('English', 'EN');
    await expect(createLanguage('english', 'EN2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'language_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code', async () => {
    await createLanguage('English', 'EN');
    await expect(createLanguage('Hindi', 'en')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'language_code_idx' },
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createLanguage('English', 'EN');
    await languageRepository.deleteLanguage(created.id);
    await expect(createLanguage('english', 'en')).resolves.toMatchObject({
      name: 'english',
      code: 'en',
    });
  });

  it('should search by name and code', async () => {
    await createLanguage('English', 'EN');
    await createLanguage('Hindi', 'HI');
    expect(
      (await languageRepository.getLanguages({ query: 'eng' })).data.map((l) => l.code)
    ).toEqual(['EN']);
    expect(
      (await languageRepository.getLanguages({ query: 'HI' })).data.map((l) => l.name)
    ).toEqual(['Hindi']);
  });

  it('should paginate list results and return total', async () => {
    await createLanguage('Alpha', 'A');
    await createLanguage('Bravo', 'B');
    await createLanguage('Charlie', 'C');
    const result = await languageRepository.getLanguages({
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((l) => l.name)).toEqual(['Charlie']);
  });

  it('should find active language by name', async () => {
    await createLanguage('English', 'EN');
    await expect(languageRepository.findActiveByName('English')).resolves.toMatchObject({
      name: 'English',
    });
  });

  it('should find active language by code', async () => {
    await createLanguage('English', 'EN');
    await expect(languageRepository.findActiveByCode('EN')).resolves.toMatchObject({
      code: 'EN',
    });
  });

  it('should find active language by name case-insensitively', async () => {
    await createLanguage('English', 'EN');
    await expect(languageRepository.findActiveByName('english')).resolves.toMatchObject({
      name: 'English',
    });
  });

  it('should find active language by code case-insensitively', async () => {
    await createLanguage('English', 'EN');
    await expect(languageRepository.findActiveByCode('en')).resolves.toMatchObject({
      code: 'EN',
    });
  });

  it('should not find soft-deleted language by name', async () => {
    const created = await createLanguage('English', 'EN');
    await languageRepository.deleteLanguage(created.id);
    await expect(languageRepository.findActiveByName('English')).resolves.toBeUndefined();
  });

  it('should not find soft-deleted language by code', async () => {
    const created = await createLanguage('English', 'EN');
    await languageRepository.deleteLanguage(created.id);
    await expect(languageRepository.findActiveByCode('EN')).resolves.toBeUndefined();
  });

  it('should find active language by name excluding id', async () => {
    const created = await createLanguage('English', 'EN');
    await expect(
      languageRepository.findActiveByName('English', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });

  it('should find active language by code excluding id', async () => {
    const created = await createLanguage('English', 'EN');
    await expect(
      languageRepository.findActiveByCode('EN', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });
});
