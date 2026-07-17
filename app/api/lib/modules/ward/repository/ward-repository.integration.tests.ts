import { describe, expect, it } from 'vitest';

import { wardRepository } from './ward-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createWard = (tenantId: string, name: string, code: string) =>
  wardRepository.createWard({
    tenantId,
    name,
    code,
    description: `${name} desc`,
  });

describe('Ward repository', () => {
  it('should create and read back a ward', async () => {
    const created = await createWard(tenantA, 'General Ward', 'GEN');

    await expect(wardRepository.getWardById(created.id, tenantA)).resolves.toMatchObject({
      id: created.id,
      name: 'General Ward',
      code: 'GEN',
      tenantId: tenantA,
    });
  });

  it('should not get a row created by another tenant', async () => {
    const created = await createWard(tenantA, 'General Ward', 'GEN');

    await expect(wardRepository.getWardById(created.id, tenantB)).resolves.toBeUndefined();
  });

  it('should exclude soft-deleted rows from reads', async () => {
    const created = await createWard(tenantA, 'Maternity', 'MAT');

    await wardRepository.deleteWard(created.id, tenantA);

    await expect(wardRepository.getWardById(created.id, tenantA)).resolves.toBeUndefined();
  });

  it('should not soft-delete a row belonging to another tenant', async () => {
    const created = await createWard(tenantA, 'Procedure', 'PROC');

    await expect(wardRepository.deleteWard(created.id, tenantB)).resolves.toBeUndefined();
    await expect(wardRepository.getWardById(created.id, tenantA)).resolves.toBeDefined();
  });

  it('should update a ward within the tenant', async () => {
    const created = await createWard(tenantA, 'Maternity', 'MAT');

    const updated = await wardRepository.updateWard(created.id, {
      tenantId: tenantA,
      name: 'Maternity Ward',
      code: 'MATW',
      description: undefined,
    });

    expect(updated).toMatchObject({ name: 'Maternity Ward', code: 'MATW', description: null });
  });

  it('should not update a row belonging to another tenant', async () => {
    const created = await createWard(tenantA, 'Maternity', 'MAT');

    await expect(
      wardRepository.updateWard(created.id, {
        tenantId: tenantB,
        name: 'Hijacked',
        code: 'HJK',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should reject a duplicate name within a tenant case-insensitively', async () => {
    await createWard(tenantA, 'General Ward', 'GEN');

    await expect(createWard(tenantA, 'general ward', 'GEN2')).rejects.toThrow();
  });

  it('should reject a duplicate code within a tenant case-insensitively', async () => {
    await createWard(tenantA, 'General Ward', 'GEN');

    await expect(createWard(tenantA, 'Another Name', 'gen')).rejects.toThrow();
  });

  it('should allow the same name and code in a different tenant', async () => {
    await createWard(tenantA, 'General Ward', 'GEN');

    await expect(createWard(tenantB, 'General Ward', 'GEN')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing the name of a soft-deleted ward', async () => {
    const created = await createWard(tenantA, 'General Ward', 'GEN');
    await wardRepository.deleteWard(created.id, tenantA);

    await expect(createWard(tenantA, 'General Ward', 'GEN')).resolves.toMatchObject({
      name: 'General Ward',
    });
  });

  it('should find an active ward by name case-insensitively', async () => {
    await createWard(tenantA, 'General Ward', 'GEN');

    await expect(wardRepository.findActiveByName(tenantA, 'general ward')).resolves.toMatchObject({
      code: 'GEN',
    });
    await expect(wardRepository.findActiveByName(tenantB, 'general ward')).resolves.toBeUndefined();
  });

  it('should exclude the given id from the uniqueness lookups', async () => {
    const created = await createWard(tenantA, 'General Ward', 'GEN');

    await expect(
      wardRepository.findActiveByName(tenantA, 'General Ward', { excludeId: created.id })
    ).resolves.toBeUndefined();
    await expect(
      wardRepository.findActiveByCode(tenantA, 'GEN', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });

  it('should list only the tenant rows ordered by name with pagination', async () => {
    await createWard(tenantA, 'Pediatric', 'PED');
    await createWard(tenantA, 'Maternity', 'MAT');
    await createWard(tenantA, 'General Ward', 'GEN');
    await createWard(tenantB, 'Other Tenant', 'OTH');

    const firstPage = await wardRepository.getWards({
      tenantId: tenantA,
      page: 1,
      limit: 2,
    });

    expect(firstPage.total).toBe(3);
    expect(firstPage.data.map((row) => row.name)).toEqual(['General Ward', 'Maternity']);

    const secondPage = await wardRepository.getWards({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });

    expect(secondPage.data.map((row) => row.name)).toEqual(['Pediatric']);
  });

  it('should search by name and code', async () => {
    await createWard(tenantA, 'General Ward', 'GEN');
    await createWard(tenantA, 'Pediatric', 'PED');

    const byName = await wardRepository.getWards({ tenantId: tenantA, query: 'pedi' });
    expect(byName.data.map((row) => row.code)).toEqual(['PED']);

    const byCode = await wardRepository.getWards({ tenantId: tenantA, query: 'gen' });
    expect(byCode.data.map((row) => row.code)).toEqual(['GEN']);
  });

  it('should exclude soft-deleted rows from the list', async () => {
    const created = await createWard(tenantA, 'General Ward', 'GEN');
    await createWard(tenantA, 'Maternity', 'MAT');
    await wardRepository.deleteWard(created.id, tenantA);

    const result = await wardRepository.getWards({ tenantId: tenantA });

    expect(result.total).toBe(1);
    expect(result.data.map((row) => row.code)).toEqual(['MAT']);
  });
});
