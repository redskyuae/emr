import { describe, expect, it } from 'vitest';

import { admitSourceRepository } from './admit-source-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createAdmitSource = (tenantId: string, name: string, code: string) =>
  admitSourceRepository.createAdmitSource({
    tenantId,
    name,
    code,
    description: `${name} desc`,
  });

describe('AdmitSource repository', () => {
  it('should create and read back a admit source', async () => {
    const created = await createAdmitSource(tenantA, 'Doctor Referral', 'DOCREF');

    await expect(
      admitSourceRepository.getAdmitSourceById(created.id, tenantA)
    ).resolves.toMatchObject({
      id: created.id,
      name: 'Doctor Referral',
      code: 'DOCREF',
      tenantId: tenantA,
    });
  });

  it('should not get a row created by another tenant', async () => {
    const created = await createAdmitSource(tenantA, 'Doctor Referral', 'DOCREF');

    await expect(
      admitSourceRepository.getAdmitSourceById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should exclude soft-deleted rows from reads', async () => {
    const created = await createAdmitSource(tenantA, 'Clinic Referral', 'CLINREF');

    await admitSourceRepository.deleteAdmitSource(created.id, tenantA);

    await expect(
      admitSourceRepository.getAdmitSourceById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should not soft-delete a row belonging to another tenant', async () => {
    const created = await createAdmitSource(tenantA, 'Emergency', 'EMER');

    await expect(
      admitSourceRepository.deleteAdmitSource(created.id, tenantB)
    ).resolves.toBeUndefined();
    await expect(
      admitSourceRepository.getAdmitSourceById(created.id, tenantA)
    ).resolves.toBeDefined();
  });

  it('should update a admit source within the tenant', async () => {
    const created = await createAdmitSource(tenantA, 'Clinic Referral', 'CLINREF');

    const updated = await admitSourceRepository.updateAdmitSource(created.id, {
      tenantId: tenantA,
      name: 'Clinic Referral Unit',
      code: 'CLINREFV',
      description: undefined,
    });

    expect(updated).toMatchObject({
      name: 'Clinic Referral Unit',
      code: 'CLINREFV',
      description: null,
    });
  });

  it('should not update a row belonging to another tenant', async () => {
    const created = await createAdmitSource(tenantA, 'Clinic Referral', 'CLINREF');

    await expect(
      admitSourceRepository.updateAdmitSource(created.id, {
        tenantId: tenantB,
        name: 'Hijacked',
        code: 'HJK',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should reject a duplicate name within a tenant case-insensitively', async () => {
    await createAdmitSource(tenantA, 'Doctor Referral', 'DOCREF');

    await expect(createAdmitSource(tenantA, 'doctor referral', 'DOCREF2')).rejects.toThrow();
  });

  it('should reject a duplicate code within a tenant case-insensitively', async () => {
    await createAdmitSource(tenantA, 'Doctor Referral', 'DOCREF');

    await expect(createAdmitSource(tenantA, 'Another Name', 'docref')).rejects.toThrow();
  });

  it('should allow the same name and code in a different tenant', async () => {
    await createAdmitSource(tenantA, 'Doctor Referral', 'DOCREF');

    await expect(createAdmitSource(tenantB, 'Doctor Referral', 'DOCREF')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing the name of a soft-deleted admit source', async () => {
    const created = await createAdmitSource(tenantA, 'Doctor Referral', 'DOCREF');
    await admitSourceRepository.deleteAdmitSource(created.id, tenantA);

    await expect(createAdmitSource(tenantA, 'Doctor Referral', 'DOCREF')).resolves.toMatchObject({
      name: 'Doctor Referral',
    });
  });

  it('should find an active admit source by name case-insensitively', async () => {
    await createAdmitSource(tenantA, 'Doctor Referral', 'DOCREF');

    await expect(
      admitSourceRepository.findActiveByName(tenantA, 'doctor referral')
    ).resolves.toMatchObject({ code: 'DOCREF' });
    await expect(
      admitSourceRepository.findActiveByName(tenantB, 'doctor referral')
    ).resolves.toBeUndefined();
  });

  it('should exclude the given id from the uniqueness lookups', async () => {
    const created = await createAdmitSource(tenantA, 'Doctor Referral', 'DOCREF');

    await expect(
      admitSourceRepository.findActiveByName(tenantA, 'Doctor Referral', { excludeId: created.id })
    ).resolves.toBeUndefined();
    await expect(
      admitSourceRepository.findActiveByCode(tenantA, 'DOCREF', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });

  it('should list only the tenant rows ordered by name with pagination', async () => {
    await createAdmitSource(tenantA, 'Hospital Transfer', 'HOSPTRF');
    await createAdmitSource(tenantA, 'Clinic Referral', 'CLINREF');
    await createAdmitSource(tenantA, 'Doctor Referral', 'DOCREF');
    await createAdmitSource(tenantB, 'Other Tenant', 'OTH');

    const firstPage = await admitSourceRepository.getAdmitSources({
      tenantId: tenantA,
      page: 1,
      limit: 2,
    });

    expect(firstPage.total).toBe(3);
    expect(firstPage.data.map((row) => row.name)).toEqual(['Clinic Referral', 'Doctor Referral']);

    const secondPage = await admitSourceRepository.getAdmitSources({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });

    expect(secondPage.data.map((row) => row.name)).toEqual(['Hospital Transfer']);
  });

  it('should search by name and code', async () => {
    await createAdmitSource(tenantA, 'Doctor Referral', 'DOCREF');
    await createAdmitSource(tenantA, 'Hospital Transfer', 'HOSPTRF');

    const byName = await admitSourceRepository.getAdmitSources({
      tenantId: tenantA,
      query: 'hosp',
    });
    expect(byName.data.map((row) => row.code)).toEqual(['HOSPTRF']);

    const byCode = await admitSourceRepository.getAdmitSources({
      tenantId: tenantA,
      query: 'docref',
    });
    expect(byCode.data.map((row) => row.code)).toEqual(['DOCREF']);
  });

  it('should exclude soft-deleted rows from the list', async () => {
    const created = await createAdmitSource(tenantA, 'Doctor Referral', 'DOCREF');
    await createAdmitSource(tenantA, 'Clinic Referral', 'CLINREF');
    await admitSourceRepository.deleteAdmitSource(created.id, tenantA);

    const result = await admitSourceRepository.getAdmitSources({ tenantId: tenantA });

    expect(result.total).toBe(1);
    expect(result.data.map((row) => row.code)).toEqual(['CLINREF']);
  });

  it('should seed defaults without overwriting existing rows', async () => {
    await admitSourceRepository.seedDefaultAdmitSources(tenantA, [
      { name: 'Doctor Referral', code: 'DOCREF', description: undefined },
      { name: 'Clinic Referral', code: 'CLINREF', description: undefined },
    ]);

    const result = await admitSourceRepository.getAdmitSources({ tenantId: tenantA });

    expect(result.total).toBe(2);
  });

  it('should do nothing when seeding an empty default list', async () => {
    await admitSourceRepository.seedDefaultAdmitSources(tenantA, []);

    await expect(
      admitSourceRepository.getAdmitSources({ tenantId: tenantA })
    ).resolves.toMatchObject({
      total: 0,
    });
  });
});
