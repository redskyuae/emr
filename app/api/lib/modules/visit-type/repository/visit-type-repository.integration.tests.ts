import { describe, expect, it } from 'vitest';

import { visitTypeRepository } from './visit-type-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createVisitType = (tenantId: string, name: string, code: string) =>
  visitTypeRepository.createVisitType({
    tenantId,
    name,
    code,
    description: `${name} desc`,
  });

describe('VisitType repository', () => {
  it('should create and read back a visit type', async () => {
    const created = await createVisitType(tenantA, 'OPD Consultation', 'OPD');

    await expect(visitTypeRepository.getVisitTypeById(created.id, tenantA)).resolves.toMatchObject({
      id: created.id,
      name: 'OPD Consultation',
      code: 'OPD',
      tenantId: tenantA,
    });
  });

  it('should not get a row created by another tenant', async () => {
    const created = await createVisitType(tenantA, 'OPD Consultation', 'OPD');

    await expect(
      visitTypeRepository.getVisitTypeById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should exclude soft-deleted rows from reads', async () => {
    const created = await createVisitType(tenantA, 'Follow-up', 'FUP');

    await visitTypeRepository.deleteVisitType(created.id, tenantA);

    await expect(
      visitTypeRepository.getVisitTypeById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should not soft-delete a row belonging to another tenant', async () => {
    const created = await createVisitType(tenantA, 'Procedure', 'PROC');

    await expect(visitTypeRepository.deleteVisitType(created.id, tenantB)).resolves.toBeUndefined();
    await expect(visitTypeRepository.getVisitTypeById(created.id, tenantA)).resolves.toBeDefined();
  });

  it('should update a visit type within the tenant', async () => {
    const created = await createVisitType(tenantA, 'Follow-up', 'FUP');

    const updated = await visitTypeRepository.updateVisitType(created.id, {
      tenantId: tenantA,
      name: 'Follow-up Visit',
      code: 'FUPV',
      description: undefined,
    });

    expect(updated).toMatchObject({ name: 'Follow-up Visit', code: 'FUPV', description: null });
  });

  it('should not update a row belonging to another tenant', async () => {
    const created = await createVisitType(tenantA, 'Follow-up', 'FUP');

    await expect(
      visitTypeRepository.updateVisitType(created.id, {
        tenantId: tenantB,
        name: 'Hijacked',
        code: 'HJK',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should reject a duplicate name within a tenant case-insensitively', async () => {
    await createVisitType(tenantA, 'OPD Consultation', 'OPD');

    await expect(createVisitType(tenantA, 'opd consultation', 'OPD2')).rejects.toThrow();
  });

  it('should reject a duplicate code within a tenant case-insensitively', async () => {
    await createVisitType(tenantA, 'OPD Consultation', 'OPD');

    await expect(createVisitType(tenantA, 'Another Name', 'opd')).rejects.toThrow();
  });

  it('should allow the same name and code in a different tenant', async () => {
    await createVisitType(tenantA, 'OPD Consultation', 'OPD');

    await expect(createVisitType(tenantB, 'OPD Consultation', 'OPD')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing the name of a soft-deleted visit type', async () => {
    const created = await createVisitType(tenantA, 'OPD Consultation', 'OPD');
    await visitTypeRepository.deleteVisitType(created.id, tenantA);

    await expect(createVisitType(tenantA, 'OPD Consultation', 'OPD')).resolves.toMatchObject({
      name: 'OPD Consultation',
    });
  });

  it('should find an active visit type by name case-insensitively', async () => {
    await createVisitType(tenantA, 'OPD Consultation', 'OPD');

    await expect(
      visitTypeRepository.findActiveByName(tenantA, 'opd consultation')
    ).resolves.toMatchObject({ code: 'OPD' });
    await expect(
      visitTypeRepository.findActiveByName(tenantB, 'opd consultation')
    ).resolves.toBeUndefined();
  });

  it('should exclude the given id from the uniqueness lookups', async () => {
    const created = await createVisitType(tenantA, 'OPD Consultation', 'OPD');

    await expect(
      visitTypeRepository.findActiveByName(tenantA, 'OPD Consultation', { excludeId: created.id })
    ).resolves.toBeUndefined();
    await expect(
      visitTypeRepository.findActiveByCode(tenantA, 'OPD', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });

  it('should list only the tenant rows ordered by name with pagination', async () => {
    await createVisitType(tenantA, 'Vaccination', 'VAC');
    await createVisitType(tenantA, 'Follow-up', 'FUP');
    await createVisitType(tenantA, 'OPD Consultation', 'OPD');
    await createVisitType(tenantB, 'Other Tenant', 'OTH');

    const firstPage = await visitTypeRepository.getVisitTypes({
      tenantId: tenantA,
      page: 1,
      limit: 2,
    });

    expect(firstPage.total).toBe(3);
    expect(firstPage.data.map((row) => row.name)).toEqual(['Follow-up', 'OPD Consultation']);

    const secondPage = await visitTypeRepository.getVisitTypes({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });

    expect(secondPage.data.map((row) => row.name)).toEqual(['Vaccination']);
  });

  it('should search by name and code', async () => {
    await createVisitType(tenantA, 'OPD Consultation', 'OPD');
    await createVisitType(tenantA, 'Vaccination', 'VAC');

    const byName = await visitTypeRepository.getVisitTypes({ tenantId: tenantA, query: 'vacc' });
    expect(byName.data.map((row) => row.code)).toEqual(['VAC']);

    const byCode = await visitTypeRepository.getVisitTypes({ tenantId: tenantA, query: 'opd' });
    expect(byCode.data.map((row) => row.code)).toEqual(['OPD']);
  });

  it('should exclude soft-deleted rows from the list', async () => {
    const created = await createVisitType(tenantA, 'OPD Consultation', 'OPD');
    await createVisitType(tenantA, 'Follow-up', 'FUP');
    await visitTypeRepository.deleteVisitType(created.id, tenantA);

    const result = await visitTypeRepository.getVisitTypes({ tenantId: tenantA });

    expect(result.total).toBe(1);
    expect(result.data.map((row) => row.code)).toEqual(['FUP']);
  });

  it('should seed defaults without overwriting existing rows', async () => {
    await visitTypeRepository.seedDefaultVisitTypes(tenantA, [
      { name: 'OPD Consultation', code: 'OPD', description: undefined },
      { name: 'Follow-up', code: 'FUP', description: undefined },
    ]);

    const result = await visitTypeRepository.getVisitTypes({ tenantId: tenantA });

    expect(result.total).toBe(2);
  });

  it('should do nothing when seeding an empty default list', async () => {
    await visitTypeRepository.seedDefaultVisitTypes(tenantA, []);

    await expect(visitTypeRepository.getVisitTypes({ tenantId: tenantA })).resolves.toMatchObject({
      total: 0,
    });
  });
});
