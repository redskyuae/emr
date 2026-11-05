import { describe, expect, it } from 'vitest';

import { diagnosisCodeRepository } from './diagnosis-code-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createCode = (tenantId: string, code: string, title: string) =>
  diagnosisCodeRepository.createDiagnosisCode({
    tenantId,
    code,
    title,
    category: `${title} category`,
  });

describe('DiagnosisCode repository', () => {
  it('should create diagnosis code for a tenant', async () => {
    const created = await createCode(tenantA, 'I10', 'Essential hypertension');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      code: 'I10',
      title: 'Essential hypertension',
      category: 'Essential hypertension category',
    });
  });

  it('should get diagnosis code by id for same tenant', async () => {
    const created = await createCode(tenantA, 'E11', 'Type 2 diabetes mellitus');
    await expect(
      diagnosisCodeRepository.getDiagnosisCodeById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id, tenantId: tenantA });
  });

  it('should not get diagnosis code by id for another tenant', async () => {
    const created = await createCode(tenantA, 'J45', 'Asthma');
    await expect(
      diagnosisCodeRepository.getDiagnosisCodeById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only diagnosis codes for the requested tenant', async () => {
    await createCode(tenantA, 'I10', 'Essential hypertension');
    await createCode(tenantB, 'E11', 'Type 2 diabetes mellitus');
    const result = await diagnosisCodeRepository.getDiagnosisCodes({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted diagnosis codes', async () => {
    const deleted = await createCode(tenantA, 'I10', 'Essential hypertension');
    await diagnosisCodeRepository.deleteDiagnosisCode(deleted.id, tenantA);
    await createCode(tenantA, 'E11', 'Type 2 diabetes mellitus');
    const result = await diagnosisCodeRepository.getDiagnosisCodes({ tenantId: tenantA });
    expect(result.data.map((entry) => entry.code)).toEqual(['E11']);
  });

  it('should soft-delete diagnosis code and exclude it from future reads', async () => {
    const created = await createCode(tenantA, 'I10', 'Essential hypertension');
    await expect(
      diagnosisCodeRepository.deleteDiagnosisCode(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id });
    await expect(
      diagnosisCodeRepository.getDiagnosisCodeById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it("should not delete another tenant's diagnosis code", async () => {
    const created = await createCode(tenantA, 'I10', 'Essential hypertension');
    await expect(
      diagnosisCodeRepository.deleteDiagnosisCode(created.id, tenantB)
    ).resolves.toBeUndefined();
    await expect(
      diagnosisCodeRepository.getDiagnosisCodeById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id });
  });

  it('should update only active diagnosis code for the requested tenant', async () => {
    const created = await createCode(tenantA, 'I10', 'Essential hypertension');
    await expect(
      diagnosisCodeRepository.updateDiagnosisCode(created.id, {
        tenantId: tenantA,
        code: 'I11',
        title: 'Hypertensive heart disease',
        category: undefined,
      })
    ).resolves.toMatchObject({ code: 'I11', title: 'Hypertensive heart disease' });
    await diagnosisCodeRepository.deleteDiagnosisCode(created.id, tenantA);
    await expect(
      diagnosisCodeRepository.updateDiagnosisCode(created.id, {
        tenantId: tenantA,
        code: 'I10',
        title: 'Essential hypertension',
        category: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createCode(tenantA, 'I10', 'Essential hypertension');
    await expect(createCode(tenantA, 'i10', 'Duplicate code')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'diagnosis_code_tenant_code_idx' },
    });
  });

  it('should allow same code across different tenants', async () => {
    await createCode(tenantA, 'I10', 'Essential hypertension');
    await expect(createCode(tenantB, 'I10', 'Essential hypertension')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing code after the previous row is soft-deleted', async () => {
    const created = await createCode(tenantA, 'I10', 'Essential hypertension');
    await diagnosisCodeRepository.deleteDiagnosisCode(created.id, tenantA);
    await expect(createCode(tenantA, 'i10', 'Essential hypertension')).resolves.toMatchObject({
      code: 'i10',
    });
  });

  it('should search by title and code', async () => {
    await createCode(tenantA, 'I10', 'Essential hypertension');
    await createCode(tenantA, 'E11', 'Type 2 diabetes mellitus');
    expect(
      (
        await diagnosisCodeRepository.getDiagnosisCodes({ tenantId: tenantA, query: 'diabetes' })
      ).data.map((entry) => entry.code)
    ).toEqual(['E11']);
    expect(
      (
        await diagnosisCodeRepository.getDiagnosisCodes({ tenantId: tenantA, query: 'I10' })
      ).data.map((entry) => entry.title)
    ).toEqual(['Essential hypertension']);
  });

  it('should create diagnosis codes as active by default', async () => {
    const created = await createCode(tenantA, 'I10', 'Essential hypertension');
    expect(created.isActive).toBe(true);
  });

  it('should deactivate and reactivate a diagnosis code', async () => {
    const created = await createCode(tenantA, 'I10', 'Essential hypertension');

    await expect(
      diagnosisCodeRepository.setDiagnosisCodeActive(created.id, tenantA, false)
    ).resolves.toMatchObject({ id: created.id, isActive: false });
    await expect(
      diagnosisCodeRepository.setDiagnosisCodeActive(created.id, tenantA, true)
    ).resolves.toMatchObject({ id: created.id, isActive: true });
  });

  it("should not change another tenant's diagnosis code active state", async () => {
    const created = await createCode(tenantA, 'I10', 'Essential hypertension');

    await expect(
      diagnosisCodeRepository.setDiagnosisCodeActive(created.id, tenantB, false)
    ).resolves.toBeUndefined();
    await expect(
      diagnosisCodeRepository.getDiagnosisCodeById(created.id, tenantA)
    ).resolves.toMatchObject({ isActive: true });
  });

  it('should not change the active state of a soft-deleted diagnosis code', async () => {
    const created = await createCode(tenantA, 'I10', 'Essential hypertension');
    await diagnosisCodeRepository.deleteDiagnosisCode(created.id, tenantA);

    await expect(
      diagnosisCodeRepository.setDiagnosisCodeActive(created.id, tenantA, false)
    ).resolves.toBeUndefined();
  });

  it('should filter the list by active state and return all codes without a filter', async () => {
    const activeCode = await createCode(tenantA, 'I10', 'Essential hypertension');
    const inactiveCode = await createCode(tenantA, 'E11', 'Type 2 diabetes mellitus');
    await diagnosisCodeRepository.setDiagnosisCodeActive(inactiveCode.id, tenantA, false);

    const codesFor = async (isActive?: boolean) =>
      (await diagnosisCodeRepository.getDiagnosisCodes({ tenantId: tenantA, isActive })).data.map(
        (entry) => entry.id
      );

    await expect(codesFor(true)).resolves.toEqual([activeCode.id]);
    await expect(codesFor(false)).resolves.toEqual([inactiveCode.id]);
    await expect(codesFor()).resolves.toEqual([inactiveCode.id, activeCode.id]);
  });

  it('should keep an inactive code reserved for uniqueness', async () => {
    const created = await createCode(tenantA, 'I10', 'Essential hypertension');
    await diagnosisCodeRepository.setDiagnosisCodeActive(created.id, tenantA, false);

    await expect(createCode(tenantA, 'I10', 'Duplicate')).rejects.toThrow();
  });

  it('should paginate list results and return total', async () => {
    await createCode(tenantA, 'A00', 'Alpha');
    await createCode(tenantA, 'B00', 'Bravo');
    await createCode(tenantA, 'C00', 'Charlie');
    const result = await diagnosisCodeRepository.getDiagnosisCodes({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((entry) => entry.code)).toEqual(['C00']);
  });
});
