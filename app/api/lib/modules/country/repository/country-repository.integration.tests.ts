import { describe, expect, it } from 'vitest';

import { countryRepository } from './country-repository';

const createCountry = (name: string, code: string) =>
  countryRepository.createCountry({
    name,
    code,
  });

describe('Country repository', () => {
  it('should create country', async () => {
    const created = await createCountry('India', 'IND');
    expect(created).toMatchObject({
      id: expect.any(Number),
      name: 'India',
      code: 'IND',
    });
  });

  it('should get country by id', async () => {
    const created = await createCountry('United States', 'USA');
    await expect(countryRepository.getCountryById(created.id)).resolves.toMatchObject({
      id: created.id,
      name: 'United States',
    });
  });

  it('should list countries', async () => {
    await createCountry('India', 'IND');
    await createCountry('United States', 'USA');
    const result = await countryRepository.getCountries();
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should not list soft-deleted countries', async () => {
    const deleted = await createCountry('United Kingdom', 'GBR');
    await countryRepository.deleteCountry(deleted.id);
    await createCountry('Canada', 'CAN');
    const result = await countryRepository.getCountries();
    expect(result.data.map((c) => c.code)).toEqual(['CAN']);
  });

  it('should soft-delete country and exclude it from future reads', async () => {
    const created = await createCountry('Australia', 'AUS');
    await expect(countryRepository.deleteCountry(created.id)).resolves.toMatchObject({
      id: created.id,
    });
    await expect(countryRepository.getCountryById(created.id)).resolves.toBeUndefined();
  });

  it('should update only active country', async () => {
    const created = await createCountry('France', 'FRA');
    await expect(
      countryRepository.updateCountry(created.id, {
        name: 'French Republic',
        code: 'FRA',
      })
    ).resolves.toMatchObject({ name: 'French Republic', code: 'FRA' });
    await countryRepository.deleteCountry(created.id);
    await expect(
      countryRepository.updateCountry(created.id, {
        name: 'France',
        code: 'FRA',
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name', async () => {
    await createCountry('India', 'IND');
    await expect(createCountry('india', 'IND2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'country_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code', async () => {
    await createCountry('India', 'IND');
    await expect(createCountry('United States', 'ind')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'country_code_idx' },
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createCountry('India', 'IND');
    await countryRepository.deleteCountry(created.id);
    await expect(createCountry('india', 'ind')).resolves.toMatchObject({
      name: 'india',
      code: 'ind',
    });
  });

  it('should search by name and code', async () => {
    await createCountry('India', 'IND');
    await createCountry('United States', 'USA');
    expect(
      (await countryRepository.getCountries({ query: 'ind' })).data.map((c) => c.code)
    ).toEqual(['IND']);
    expect(
      (await countryRepository.getCountries({ query: 'USA' })).data.map((c) => c.name)
    ).toEqual(['United States']);
  });

  it('should paginate list results and return total', async () => {
    await createCountry('Alpha', 'A');
    await createCountry('Bravo', 'B');
    await createCountry('Charlie', 'C');
    const result = await countryRepository.getCountries({
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((c) => c.name)).toEqual(['Charlie']);
  });

  it('should find active country by name', async () => {
    await createCountry('India', 'IND');
    await expect(countryRepository.findActiveByName('India')).resolves.toMatchObject({
      name: 'India',
    });
  });

  it('should find active country by code', async () => {
    await createCountry('India', 'IND');
    await expect(countryRepository.findActiveByCode('IND')).resolves.toMatchObject({
      code: 'IND',
    });
  });

  it('should find active country by name case-insensitively', async () => {
    await createCountry('India', 'IND');
    await expect(countryRepository.findActiveByName('india')).resolves.toMatchObject({
      name: 'India',
    });
  });

  it('should find active country by code case-insensitively', async () => {
    await createCountry('India', 'IND');
    await expect(countryRepository.findActiveByCode('ind')).resolves.toMatchObject({
      code: 'IND',
    });
  });

  it('should not find soft-deleted country by name', async () => {
    const created = await createCountry('India', 'IND');
    await countryRepository.deleteCountry(created.id);
    await expect(countryRepository.findActiveByName('India')).resolves.toBeUndefined();
  });

  it('should not find soft-deleted country by code', async () => {
    const created = await createCountry('India', 'IND');
    await countryRepository.deleteCountry(created.id);
    await expect(countryRepository.findActiveByCode('IND')).resolves.toBeUndefined();
  });

  it('should find active country by name excluding id', async () => {
    const created = await createCountry('India', 'IND');
    await expect(
      countryRepository.findActiveByName('India', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });

  it('should find active country by code excluding id', async () => {
    const created = await createCountry('India', 'IND');
    await expect(
      countryRepository.findActiveByCode('IND', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });
});
