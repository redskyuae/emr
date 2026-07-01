import { describe, expect, it } from 'vitest';

import { countryRepository } from '@/app/api/lib/modules/country/repository/country-repository';
import { stateRepository } from './state-repository';

const createCountry = (name: string, code: string) =>
  countryRepository.createCountry({
    name,
    code,
  });

const createState = async (countryId: number, name: string) => {
  const state = await stateRepository.createState({ countryId, name });
  if (!state) throw new Error('createState returned no row');
  return state;
};

describe('State repository', () => {
  it('should create state with country', async () => {
    const country = await createCountry('India', 'IND');
    const created = await createState(country.id, 'Tamil Nadu');
    expect(created).toMatchObject({
      id: expect.any(Number),
      name: 'Tamil Nadu',
      countryId: country.id,
      country: expect.objectContaining({
        id: country.id,
        name: 'India',
      }),
    });
  });

  it('should get state by id with country', async () => {
    const country = await createCountry('India', 'IND');
    const created = await createState(country.id, 'Karnataka');
    await expect(stateRepository.getStateById(created.id)).resolves.toMatchObject({
      id: created.id,
      name: 'Karnataka',
      country: expect.objectContaining({
        name: 'India',
      }),
    });
  });

  it('should list states with countries', async () => {
    const india = await createCountry('India', 'IND');
    const usa = await createCountry('United States', 'USA');
    await createState(india.id, 'Tamil Nadu');
    await createState(usa.id, 'California');
    const result = await stateRepository.getStates();
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter states by country', async () => {
    const india = await createCountry('India', 'IND');
    const usa = await createCountry('United States', 'USA');
    await createState(india.id, 'Tamil Nadu');
    await createState(india.id, 'Karnataka');
    await createState(usa.id, 'California');
    const result = await stateRepository.getStates({ countryId: india.id });
    expect(result.data.map((s) => s.name)).toEqual(['Karnataka', 'Tamil Nadu']);
    expect(result.total).toBe(2);
  });

  it('should not list soft-deleted states', async () => {
    const country = await createCountry('India', 'IND');
    const deleted = await createState(country.id, 'Kerala');
    await stateRepository.deleteState(deleted.id);
    await createState(country.id, 'Maharashtra');
    const result = await stateRepository.getStates();
    expect(result.data.map((s) => s.name)).toEqual(['Maharashtra']);
  });

  it('should soft-delete state and exclude it from future reads', async () => {
    const country = await createCountry('India', 'IND');
    const created = await createState(country.id, 'Gujarat');
    await expect(stateRepository.deleteState(created.id)).resolves.toMatchObject({
      id: created.id,
    });
    await expect(stateRepository.getStateById(created.id)).resolves.toBeUndefined();
  });

  it('should update only active state', async () => {
    const country = await createCountry('India', 'IND');
    const created = await createState(country.id, 'Rajasthan');
    await expect(
      stateRepository.updateState(created.id, {
        name: 'Rajasthan',
        countryId: country.id,
      })
    ).resolves.toMatchObject({ name: 'Rajasthan' });
    await stateRepository.deleteState(created.id);
    await expect(
      stateRepository.updateState(created.id, {
        name: 'Rajasthan',
        countryId: country.id,
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per country', async () => {
    const country = await createCountry('India', 'IND');
    await createState(country.id, 'Tamil Nadu');
    await expect(createState(country.id, 'tamil nadu')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'state_name_country_idx' },
    });
  });

  it('should allow same state name in different countries', async () => {
    const india = await createCountry('India', 'IND');
    const usa = await createCountry('United States', 'USA');
    await createState(india.id, 'Orissa');
    await expect(createState(usa.id, 'Orissa')).resolves.toMatchObject({
      name: 'Orissa',
    });
  });

  it('should allow reusing name in same country after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const country = await createCountry('India', 'IND');
    const created = await createState(country.id, 'Punjab');
    await stateRepository.deleteState(created.id);
    await expect(createState(country.id, 'punjab')).resolves.toMatchObject({
      name: 'punjab',
    });
  });

  it('should search by name', async () => {
    const country = await createCountry('India', 'IND');
    await createState(country.id, 'Tamil Nadu');
    await createState(country.id, 'Karnataka');
    expect((await stateRepository.getStates({ query: 'tamil' })).data.map((s) => s.name)).toEqual([
      'Tamil Nadu',
    ]);
  });

  it('should paginate list results and return total', async () => {
    const country = await createCountry('India', 'IND');
    await createState(country.id, 'Alpha');
    await createState(country.id, 'Bravo');
    await createState(country.id, 'Charlie');
    const result = await stateRepository.getStates({
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((s) => s.name)).toEqual(['Charlie']);
  });

  it('should find active state by name and country', async () => {
    const country = await createCountry('India', 'IND');
    await createState(country.id, 'Tamil Nadu');
    await expect(
      stateRepository.findActiveByNameAndCountry('Tamil Nadu', country.id)
    ).resolves.toMatchObject({
      name: 'Tamil Nadu',
      countryId: country.id,
    });
  });

  it('should find active state by name case-insensitively', async () => {
    const country = await createCountry('India', 'IND');
    await createState(country.id, 'Tamil Nadu');
    await expect(
      stateRepository.findActiveByNameAndCountry('tamil nadu', country.id)
    ).resolves.toMatchObject({
      name: 'Tamil Nadu',
    });
  });

  it('should not find soft-deleted state by name and country', async () => {
    const country = await createCountry('India', 'IND');
    const created = await createState(country.id, 'Tamil Nadu');
    await stateRepository.deleteState(created.id);
    await expect(
      stateRepository.findActiveByNameAndCountry('Tamil Nadu', country.id)
    ).resolves.toBeUndefined();
  });

  it('should find active state by name and country excluding id', async () => {
    const country = await createCountry('India', 'IND');
    const created = await createState(country.id, 'Tamil Nadu');
    await expect(
      stateRepository.findActiveByNameAndCountry('Tamil Nadu', country.id, {
        excludeId: created.id,
      })
    ).resolves.toBeUndefined();
  });
});
