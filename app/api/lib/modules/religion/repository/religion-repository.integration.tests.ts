import { describe, expect, it } from 'vitest';

import { religionRepository } from './religion-repository';

const createReligion = (name: string, code: string) =>
  religionRepository.createReligion({
    name,
    code,
  });

describe('Religion repository', () => {
  it('should create religion', async () => {
    const created = await createReligion('Hinduism', 'HIND');
    expect(created).toMatchObject({
      id: expect.any(Number),
      name: 'Hinduism',
      code: 'HIND',
    });
  });

  it('should get religion by id', async () => {
    const created = await createReligion('Christianity', 'CHR');
    await expect(religionRepository.getReligionById(created.id)).resolves.toMatchObject({
      id: created.id,
      name: 'Christianity',
    });
  });

  it('should list religions', async () => {
    await createReligion('Hinduism', 'HIND');
    await createReligion('Christianity', 'CHR');
    const result = await religionRepository.getReligions();
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should not list soft-deleted religions', async () => {
    const deleted = await createReligion('Islam', 'ISL');
    await religionRepository.deleteReligion(deleted.id);
    await createReligion('Buddhism', 'BUD');
    const result = await religionRepository.getReligions();
    expect(result.data.map((r) => r.code)).toEqual(['BUD']);
  });

  it('should soft-delete religion and exclude it from future reads', async () => {
    const created = await createReligion('Sikhism', 'SIK');
    await expect(religionRepository.deleteReligion(created.id)).resolves.toMatchObject({
      id: created.id,
    });
    await expect(religionRepository.getReligionById(created.id)).resolves.toBeUndefined();
  });

  it('should update only active religion', async () => {
    const created = await createReligion('Jainism', 'JAI');
    await expect(
      religionRepository.updateReligion(created.id, {
        name: 'Jain',
        code: 'JAIN',
      })
    ).resolves.toMatchObject({ name: 'Jain', code: 'JAIN' });
    await religionRepository.deleteReligion(created.id);
    await expect(
      religionRepository.updateReligion(created.id, {
        name: 'Jainism',
        code: 'JAI',
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name', async () => {
    await createReligion('Hinduism', 'HIND');
    await expect(createReligion('hinduism', 'HIND2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'religion_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code', async () => {
    await createReligion('Hinduism', 'HIND');
    await expect(createReligion('Christianity', 'hind')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'religion_code_idx' },
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createReligion('Hinduism', 'HIND');
    await religionRepository.deleteReligion(created.id);
    await expect(createReligion('hinduism', 'hind')).resolves.toMatchObject({
      name: 'hinduism',
      code: 'hind',
    });
  });

  it('should search by name and code', async () => {
    await createReligion('Hinduism', 'HIND');
    await createReligion('Christianity', 'CHR');
    expect(
      (await religionRepository.getReligions({ query: 'hind' })).data.map((r) => r.code)
    ).toEqual(['HIND']);
    expect(
      (await religionRepository.getReligions({ query: 'CHR' })).data.map((r) => r.name)
    ).toEqual(['Christianity']);
  });

  it('should paginate list results and return total', async () => {
    await createReligion('Alpha', 'A');
    await createReligion('Bravo', 'B');
    await createReligion('Charlie', 'C');
    const result = await religionRepository.getReligions({
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((r) => r.name)).toEqual(['Charlie']);
  });

  it('should find active religion by name', async () => {
    await createReligion('Hinduism', 'HIND');
    await expect(religionRepository.findActiveByName('Hinduism')).resolves.toMatchObject({
      name: 'Hinduism',
    });
  });

  it('should find active religion by code', async () => {
    await createReligion('Hinduism', 'HIND');
    await expect(religionRepository.findActiveByCode('HIND')).resolves.toMatchObject({
      code: 'HIND',
    });
  });

  it('should find active religion by name case-insensitively', async () => {
    await createReligion('Hinduism', 'HIND');
    await expect(religionRepository.findActiveByName('hinduism')).resolves.toMatchObject({
      name: 'Hinduism',
    });
  });

  it('should find active religion by code case-insensitively', async () => {
    await createReligion('Hinduism', 'HIND');
    await expect(religionRepository.findActiveByCode('hind')).resolves.toMatchObject({
      code: 'HIND',
    });
  });

  it('should not find soft-deleted religion by name', async () => {
    const created = await createReligion('Hinduism', 'HIND');
    await religionRepository.deleteReligion(created.id);
    await expect(religionRepository.findActiveByName('Hinduism')).resolves.toBeUndefined();
  });

  it('should not find soft-deleted religion by code', async () => {
    const created = await createReligion('Hinduism', 'HIND');
    await religionRepository.deleteReligion(created.id);
    await expect(religionRepository.findActiveByCode('HIND')).resolves.toBeUndefined();
  });

  it('should find active religion by name excluding id', async () => {
    const created = await createReligion('Hinduism', 'HIND');
    await expect(
      religionRepository.findActiveByName('Hinduism', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });

  it('should find active religion by code excluding id', async () => {
    const created = await createReligion('Hinduism', 'HIND');
    await expect(
      religionRepository.findActiveByCode('HIND', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });
});
