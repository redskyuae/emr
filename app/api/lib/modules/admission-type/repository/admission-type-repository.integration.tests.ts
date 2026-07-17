import { describe, expect, it } from 'vitest';

import { admissionTypeRepository } from './admission-type-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createAdmissionType = (tenantId: string, name: string, code: string) =>
  admissionTypeRepository.createAdmissionType({
    tenantId,
    name,
    code,
    description: `${name} desc`,
  });

describe('AdmissionType repository', () => {
  it('should create and read back a admission type', async () => {
    const created = await createAdmissionType(tenantA, 'Emergency', 'EMER');

    await expect(
      admissionTypeRepository.getAdmissionTypeById(created.id, tenantA)
    ).resolves.toMatchObject({
      id: created.id,
      name: 'Emergency',
      code: 'EMER',
      tenantId: tenantA,
    });
  });

  it('should not get a row created by another tenant', async () => {
    const created = await createAdmissionType(tenantA, 'Emergency', 'EMER');

    await expect(
      admissionTypeRepository.getAdmissionTypeById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should exclude soft-deleted rows from reads', async () => {
    const created = await createAdmissionType(tenantA, 'Elective', 'ELEC');

    await admissionTypeRepository.deleteAdmissionType(created.id, tenantA);

    await expect(
      admissionTypeRepository.getAdmissionTypeById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should not soft-delete a row belonging to another tenant', async () => {
    const created = await createAdmissionType(tenantA, 'Procedure', 'PROC');

    await expect(
      admissionTypeRepository.deleteAdmissionType(created.id, tenantB)
    ).resolves.toBeUndefined();
    await expect(
      admissionTypeRepository.getAdmissionTypeById(created.id, tenantA)
    ).resolves.toBeDefined();
  });

  it('should update a admission type within the tenant', async () => {
    const created = await createAdmissionType(tenantA, 'Elective', 'ELEC');

    const updated = await admissionTypeRepository.updateAdmissionType(created.id, {
      tenantId: tenantA,
      name: 'Elective Planned',
      code: 'ELECP',
      description: undefined,
    });

    expect(updated).toMatchObject({ name: 'Elective Planned', code: 'ELECP', description: null });
  });

  it('should not update a row belonging to another tenant', async () => {
    const created = await createAdmissionType(tenantA, 'Elective', 'ELEC');

    await expect(
      admissionTypeRepository.updateAdmissionType(created.id, {
        tenantId: tenantB,
        name: 'Hijacked',
        code: 'HJK',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should reject a duplicate name within a tenant case-insensitively', async () => {
    await createAdmissionType(tenantA, 'Emergency', 'EMER');

    await expect(createAdmissionType(tenantA, 'emergency', 'EMER2')).rejects.toThrow();
  });

  it('should reject a duplicate code within a tenant case-insensitively', async () => {
    await createAdmissionType(tenantA, 'Emergency', 'EMER');

    await expect(createAdmissionType(tenantA, 'Another Name', 'emer')).rejects.toThrow();
  });

  it('should allow the same name and code in a different tenant', async () => {
    await createAdmissionType(tenantA, 'Emergency', 'EMER');

    await expect(createAdmissionType(tenantB, 'Emergency', 'EMER')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing the name of a soft-deleted admission type', async () => {
    const created = await createAdmissionType(tenantA, 'Emergency', 'EMER');
    await admissionTypeRepository.deleteAdmissionType(created.id, tenantA);

    await expect(createAdmissionType(tenantA, 'Emergency', 'EMER')).resolves.toMatchObject({
      name: 'Emergency',
    });
  });

  it('should find an active admission type by name case-insensitively', async () => {
    await createAdmissionType(tenantA, 'Emergency', 'EMER');

    await expect(
      admissionTypeRepository.findActiveByName(tenantA, 'emergency')
    ).resolves.toMatchObject({ code: 'EMER' });
    await expect(
      admissionTypeRepository.findActiveByName(tenantB, 'emergency')
    ).resolves.toBeUndefined();
  });

  it('should exclude the given id from the uniqueness lookups', async () => {
    const created = await createAdmissionType(tenantA, 'Emergency', 'EMER');

    await expect(
      admissionTypeRepository.findActiveByName(tenantA, 'Emergency', { excludeId: created.id })
    ).resolves.toBeUndefined();
    await expect(
      admissionTypeRepository.findActiveByCode(tenantA, 'EMER', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });

  it('should list only the tenant rows ordered by name with pagination', async () => {
    await createAdmissionType(tenantA, 'Transfer', 'TRF');
    await createAdmissionType(tenantA, 'Elective', 'ELEC');
    await createAdmissionType(tenantA, 'Emergency', 'EMER');
    await createAdmissionType(tenantB, 'Other Tenant', 'OTH');

    const firstPage = await admissionTypeRepository.getAdmissionTypes({
      tenantId: tenantA,
      page: 1,
      limit: 2,
    });

    expect(firstPage.total).toBe(3);
    expect(firstPage.data.map((row) => row.name)).toEqual(['Elective', 'Emergency']);

    const secondPage = await admissionTypeRepository.getAdmissionTypes({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });

    expect(secondPage.data.map((row) => row.name)).toEqual(['Transfer']);
  });

  it('should search by name and code', async () => {
    await createAdmissionType(tenantA, 'Emergency', 'EMER');
    await createAdmissionType(tenantA, 'Transfer', 'TRF');

    const byName = await admissionTypeRepository.getAdmissionTypes({
      tenantId: tenantA,
      query: 'trans',
    });
    expect(byName.data.map((row) => row.code)).toEqual(['TRF']);

    const byCode = await admissionTypeRepository.getAdmissionTypes({
      tenantId: tenantA,
      query: 'emer',
    });
    expect(byCode.data.map((row) => row.code)).toEqual(['EMER']);
  });

  it('should exclude soft-deleted rows from the list', async () => {
    const created = await createAdmissionType(tenantA, 'Emergency', 'EMER');
    await createAdmissionType(tenantA, 'Elective', 'ELEC');
    await admissionTypeRepository.deleteAdmissionType(created.id, tenantA);

    const result = await admissionTypeRepository.getAdmissionTypes({ tenantId: tenantA });

    expect(result.total).toBe(1);
    expect(result.data.map((row) => row.code)).toEqual(['ELEC']);
  });

  it('should seed defaults without overwriting existing rows', async () => {
    await admissionTypeRepository.seedDefaultAdmissionTypes(tenantA, [
      { name: 'Emergency', code: 'EMER', description: undefined },
      { name: 'Elective', code: 'ELEC', description: undefined },
    ]);

    const result = await admissionTypeRepository.getAdmissionTypes({ tenantId: tenantA });

    expect(result.total).toBe(2);
  });

  it('should do nothing when seeding an empty default list', async () => {
    await admissionTypeRepository.seedDefaultAdmissionTypes(tenantA, []);

    await expect(
      admissionTypeRepository.getAdmissionTypes({ tenantId: tenantA })
    ).resolves.toMatchObject({
      total: 0,
    });
  });
});
