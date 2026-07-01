import { describe, expect, it } from 'vitest';

import { nationalityRepository } from './nationality-repository';

const createNationality = (name: string, code: string) =>
  nationalityRepository.createNationality({
    name,
    code,
  });

describe('Nationality repository', () => {
  it('should create nationality', async () => {
    const created = await createNationality('Indian', 'IND');
    expect(created).toMatchObject({
      id: expect.any(Number),
      name: 'Indian',
      code: 'IND',
    });
  });

  it('should get nationality by id', async () => {
    const created = await createNationality('American', 'USA');
    await expect(nationalityRepository.getNationalityById(created.id)).resolves.toMatchObject({
      id: created.id,
      name: 'American',
    });
  });

  it('should list nationalities', async () => {
    await createNationality('Indian', 'IND');
    await createNationality('American', 'USA');
    const result = await nationalityRepository.getNationalities();
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should not list soft-deleted nationalities', async () => {
    const deleted = await createNationality('British', 'GBR');
    await nationalityRepository.deleteNationality(deleted.id);
    await createNationality('Canadian', 'CAN');
    const result = await nationalityRepository.getNationalities();
    expect(result.data.map((n) => n.code)).toEqual(['CAN']);
  });

  it('should soft-delete nationality and exclude it from future reads', async () => {
    const created = await createNationality('Australian', 'AUS');
    await expect(nationalityRepository.deleteNationality(created.id)).resolves.toMatchObject({
      id: created.id,
    });
    await expect(nationalityRepository.getNationalityById(created.id)).resolves.toBeUndefined();
  });

  it('should update only active nationality', async () => {
    const created = await createNationality('French', 'FRA');
    await expect(
      nationalityRepository.updateNationality(created.id, {
        name: 'France',
        code: 'FRA',
      })
    ).resolves.toMatchObject({ name: 'France', code: 'FRA' });
    await nationalityRepository.deleteNationality(created.id);
    await expect(
      nationalityRepository.updateNationality(created.id, {
        name: 'French',
        code: 'FRA',
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name', async () => {
    await createNationality('Indian', 'IND');
    await expect(createNationality('indian', 'IND2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'nationality_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code', async () => {
    await createNationality('Indian', 'IND');
    await expect(createNationality('American', 'ind')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'nationality_code_idx' },
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createNationality('Indian', 'IND');
    await nationalityRepository.deleteNationality(created.id);
    await expect(createNationality('indian', 'ind')).resolves.toMatchObject({
      name: 'indian',
      code: 'ind',
    });
  });

  it('should search by name and code', async () => {
    await createNationality('Indian', 'IND');
    await createNationality('American', 'USA');
    expect(
      (await nationalityRepository.getNationalities({ query: 'ind' })).data.map((n) => n.code)
    ).toEqual(['IND']);
    expect(
      (await nationalityRepository.getNationalities({ query: 'USA' })).data.map((n) => n.name)
    ).toEqual(['American']);
  });

  it('should paginate list results and return total', async () => {
    await createNationality('Alpha', 'A');
    await createNationality('Bravo', 'B');
    await createNationality('Charlie', 'C');
    const result = await nationalityRepository.getNationalities({
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((n) => n.name)).toEqual(['Charlie']);
  });

  it('should find active nationality by name', async () => {
    await createNationality('Indian', 'IND');
    await expect(nationalityRepository.findActiveByName('Indian')).resolves.toMatchObject({
      name: 'Indian',
    });
  });

  it('should find active nationality by code', async () => {
    await createNationality('Indian', 'IND');
    await expect(nationalityRepository.findActiveByCode('IND')).resolves.toMatchObject({
      code: 'IND',
    });
  });

  it('should find active nationality by name case-insensitively', async () => {
    await createNationality('Indian', 'IND');
    await expect(nationalityRepository.findActiveByName('indian')).resolves.toMatchObject({
      name: 'Indian',
    });
  });

  it('should find active nationality by code case-insensitively', async () => {
    await createNationality('Indian', 'IND');
    await expect(nationalityRepository.findActiveByCode('ind')).resolves.toMatchObject({
      code: 'IND',
    });
  });

  it('should not find soft-deleted nationality by name', async () => {
    const created = await createNationality('Indian', 'IND');
    await nationalityRepository.deleteNationality(created.id);
    await expect(nationalityRepository.findActiveByName('Indian')).resolves.toBeUndefined();
  });

  it('should not find soft-deleted nationality by code', async () => {
    const created = await createNationality('Indian', 'IND');
    await nationalityRepository.deleteNationality(created.id);
    await expect(nationalityRepository.findActiveByCode('IND')).resolves.toBeUndefined();
  });

  it('should find active nationality by name excluding id', async () => {
    const created = await createNationality('Indian', 'IND');
    await expect(
      nationalityRepository.findActiveByName('Indian', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });

  it('should find active nationality by code excluding id', async () => {
    const created = await createNationality('Indian', 'IND');
    await expect(
      nationalityRepository.findActiveByCode('IND', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });
});
