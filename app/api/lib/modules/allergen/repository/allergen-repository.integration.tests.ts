import { describe, expect, it } from 'vitest';

import { allergenRepository } from './allergen-repository';
import type { AllergenCategory } from '../schemas/allergen-schema';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createAllergen = (
  tenantId: string,
  name: string,
  code: string,
  category: AllergenCategory = 'drug'
) => allergenRepository.createAllergen({ tenantId, name, code, category });

describe('Allergen repository', () => {
  it('should create allergen for a tenant', async () => {
    const created = await createAllergen(tenantA, 'Penicillin', 'PEN');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Penicillin',
      code: 'PEN',
      category: 'drug',
    });
  });

  it('should get allergen by id for same tenant', async () => {
    const created = await createAllergen(tenantA, 'Peanuts', 'PNT', 'food');
    await expect(allergenRepository.getAllergenById(created.id, tenantA)).resolves.toMatchObject({
      id: created.id,
      category: 'food',
    });
  });

  it('should not get allergen by id for another tenant', async () => {
    const created = await createAllergen(tenantA, 'Pollen', 'PLN', 'environmental');
    await expect(allergenRepository.getAllergenById(created.id, tenantB)).resolves.toBeUndefined();
  });

  it('should list only allergens for the requested tenant', async () => {
    await createAllergen(tenantA, 'Penicillin', 'PEN');
    await createAllergen(tenantB, 'Aspirin', 'ASP');
    const result = await allergenRepository.getAllergens({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted allergens', async () => {
    const deleted = await createAllergen(tenantA, 'Penicillin', 'PEN');
    await allergenRepository.deleteAllergen(deleted.id, tenantA);
    await createAllergen(tenantA, 'Aspirin', 'ASP');
    const result = await allergenRepository.getAllergens({ tenantId: tenantA });
    expect(result.data.map((entry) => entry.code)).toEqual(['ASP']);
  });

  it('should soft-delete allergen and exclude it from future reads', async () => {
    const created = await createAllergen(tenantA, 'Penicillin', 'PEN');
    await expect(allergenRepository.deleteAllergen(created.id, tenantA)).resolves.toMatchObject({
      id: created.id,
    });
    await expect(allergenRepository.getAllergenById(created.id, tenantA)).resolves.toBeUndefined();
  });

  it("should not delete another tenant's allergen", async () => {
    const created = await createAllergen(tenantA, 'Penicillin', 'PEN');
    await expect(allergenRepository.deleteAllergen(created.id, tenantB)).resolves.toBeUndefined();
    await expect(allergenRepository.getAllergenById(created.id, tenantA)).resolves.toMatchObject({
      id: created.id,
    });
  });

  it('should update only active allergen for the requested tenant', async () => {
    const created = await createAllergen(tenantA, 'Penicillin', 'PEN');
    await expect(
      allergenRepository.updateAllergen(created.id, {
        tenantId: tenantA,
        name: 'Aspirin',
        code: 'ASP',
        category: 'drug',
      })
    ).resolves.toMatchObject({ name: 'Aspirin', code: 'ASP' });
    await allergenRepository.deleteAllergen(created.id, tenantA);
    await expect(
      allergenRepository.updateAllergen(created.id, {
        tenantId: tenantA,
        name: 'Penicillin',
        code: 'PEN',
        category: 'drug',
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createAllergen(tenantA, 'Penicillin', 'PEN');
    await expect(createAllergen(tenantA, 'penicillin', 'PEN2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'allergen_tenant_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createAllergen(tenantA, 'Penicillin', 'PEN');
    await expect(createAllergen(tenantA, 'Aspirin', 'pen')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'allergen_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createAllergen(tenantA, 'Penicillin', 'PEN');
    await expect(createAllergen(tenantB, 'Penicillin', 'PEN')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted', async () => {
    const created = await createAllergen(tenantA, 'Penicillin', 'PEN');
    await allergenRepository.deleteAllergen(created.id, tenantA);
    await expect(createAllergen(tenantA, 'penicillin', 'pen')).resolves.toMatchObject({
      name: 'penicillin',
      code: 'pen',
    });
  });

  it('should search by name and code', async () => {
    await createAllergen(tenantA, 'Penicillin', 'PEN');
    await createAllergen(tenantA, 'Aspirin', 'ASP');
    expect(
      (await allergenRepository.getAllergens({ tenantId: tenantA, query: 'aspir' })).data.map(
        (entry) => entry.code
      )
    ).toEqual(['ASP']);
    expect(
      (await allergenRepository.getAllergens({ tenantId: tenantA, query: 'PEN' })).data.map(
        (entry) => entry.name
      )
    ).toEqual(['Penicillin']);
  });

  it('should paginate list results and return total', async () => {
    await createAllergen(tenantA, 'Alpha', 'A');
    await createAllergen(tenantA, 'Bravo', 'B');
    await createAllergen(tenantA, 'Charlie', 'C');
    const result = await allergenRepository.getAllergens({ tenantId: tenantA, page: 2, limit: 2 });
    expect(result.total).toBe(3);
    expect(result.data.map((entry) => entry.name)).toEqual(['Charlie']);
  });
});
