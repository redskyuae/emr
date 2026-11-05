import { describe, expect, it } from 'vitest';

import { ayurvedaDiagnosisCodeRepository } from './ayurveda-diagnosis-code-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createCode = (tenantId: string, code: string, title: string) =>
  ayurvedaDiagnosisCodeRepository.createAyurvedaDiagnosisCode({
    tenantId,
    code,
    title,
    category: `${title} category`,
  });

describe('AyurvedaDiagnosisCode repository', () => {
  it('should create Ayurveda diagnosis code for a tenant', async () => {
    const created = await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      code: 'AYU-JVARA',
      title: 'Jvara (Fever)',
      category: 'Jvara (Fever) category',
    });
  });

  it('should get Ayurveda diagnosis code by id for same tenant', async () => {
    const created = await createCode(tenantA, 'AYU-KASA', 'Kasa (Cough)');
    await expect(
      ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id, tenantId: tenantA });
  });

  it('should not get Ayurveda diagnosis code by id for another tenant', async () => {
    const created = await createCode(tenantA, 'AYU-SHVASA', 'Shvasa (Dyspnoea)');
    await expect(
      ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only Ayurveda diagnosis codes for the requested tenant', async () => {
    await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    await createCode(tenantB, 'AYU-KASA', 'Kasa (Cough)');
    const result = await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({
      tenantId: tenantA,
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted Ayurveda diagnosis codes', async () => {
    const deleted = await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    await ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(deleted.id, tenantA);
    await createCode(tenantA, 'AYU-KASA', 'Kasa (Cough)');
    const result = await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({
      tenantId: tenantA,
    });
    expect(result.data.map((entry) => entry.code)).toEqual(['AYU-KASA']);
  });

  it('should soft-delete Ayurveda diagnosis code and exclude it from future reads', async () => {
    const created = await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    await expect(
      ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id });
    await expect(
      ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it("should not delete another tenant's Ayurveda diagnosis code", async () => {
    const created = await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    await expect(
      ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(created.id, tenantB)
    ).resolves.toBeUndefined();
    await expect(
      ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id });
  });

  it('should update only active Ayurveda diagnosis code for the requested tenant', async () => {
    const created = await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    await expect(
      ayurvedaDiagnosisCodeRepository.updateAyurvedaDiagnosisCode(created.id, {
        tenantId: tenantA,
        code: 'I11',
        title: 'Hypertensive heart disease',
        category: undefined,
      })
    ).resolves.toMatchObject({ code: 'I11', title: 'Hypertensive heart disease' });
    await ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(created.id, tenantA);
    await expect(
      ayurvedaDiagnosisCodeRepository.updateAyurvedaDiagnosisCode(created.id, {
        tenantId: tenantA,
        code: 'AYU-JVARA',
        title: 'Jvara (Fever)',
        category: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    await expect(createCode(tenantA, 'ayu-jvara', 'Duplicate code')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'ayurveda_diagnosis_code_tenant_code_idx' },
    });
  });

  it('should allow same code across different tenants', async () => {
    await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    await expect(createCode(tenantB, 'AYU-JVARA', 'Jvara (Fever)')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing code after the previous row is soft-deleted', async () => {
    const created = await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    await ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(created.id, tenantA);
    await expect(createCode(tenantA, 'ayu-jvara', 'Jvara (Fever)')).resolves.toMatchObject({
      code: 'ayu-jvara',
    });
  });

  it('should search by title and code', async () => {
    await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    await createCode(tenantA, 'AYU-KASA', 'Kasa (Cough)');
    expect(
      (
        await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({
          tenantId: tenantA,
          query: 'cough',
        })
      ).data.map((entry) => entry.code)
    ).toEqual(['AYU-KASA']);
    expect(
      (
        await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({
          tenantId: tenantA,
          query: 'AYU-JVARA',
        })
      ).data.map((entry) => entry.title)
    ).toEqual(['Jvara (Fever)']);
  });

  it('should create Ayurveda diagnosis codes as active by default', async () => {
    const created = await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    expect(created.isActive).toBe(true);
  });

  it('should deactivate and reactivate a Ayurveda diagnosis code', async () => {
    const created = await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');

    await expect(
      ayurvedaDiagnosisCodeRepository.setAyurvedaDiagnosisCodeActive(created.id, tenantA, false)
    ).resolves.toMatchObject({ id: created.id, isActive: false });
    await expect(
      ayurvedaDiagnosisCodeRepository.setAyurvedaDiagnosisCodeActive(created.id, tenantA, true)
    ).resolves.toMatchObject({ id: created.id, isActive: true });
  });

  it("should not change another tenant's Ayurveda diagnosis code active state", async () => {
    const created = await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');

    await expect(
      ayurvedaDiagnosisCodeRepository.setAyurvedaDiagnosisCodeActive(created.id, tenantB, false)
    ).resolves.toBeUndefined();
    await expect(
      ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById(created.id, tenantA)
    ).resolves.toMatchObject({ isActive: true });
  });

  it('should not change the active state of a soft-deleted Ayurveda diagnosis code', async () => {
    const created = await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    await ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(created.id, tenantA);

    await expect(
      ayurvedaDiagnosisCodeRepository.setAyurvedaDiagnosisCodeActive(created.id, tenantA, false)
    ).resolves.toBeUndefined();
  });

  it('should filter the list by active state and return all codes without a filter', async () => {
    const activeCode = await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    const inactiveCode = await createCode(tenantA, 'AYU-KASA', 'Kasa (Cough)');
    await ayurvedaDiagnosisCodeRepository.setAyurvedaDiagnosisCodeActive(
      inactiveCode.id,
      tenantA,
      false
    );

    const codesFor = async (isActive?: boolean) =>
      (
        await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({
          tenantId: tenantA,
          isActive,
        })
      ).data.map((entry) => entry.id);

    await expect(codesFor(true)).resolves.toEqual([activeCode.id]);
    await expect(codesFor(false)).resolves.toEqual([inactiveCode.id]);
    await expect(codesFor()).resolves.toEqual([activeCode.id, inactiveCode.id]);
  });

  it('should keep an inactive code reserved for uniqueness', async () => {
    const created = await createCode(tenantA, 'AYU-JVARA', 'Jvara (Fever)');
    await ayurvedaDiagnosisCodeRepository.setAyurvedaDiagnosisCodeActive(
      created.id,
      tenantA,
      false
    );

    await expect(createCode(tenantA, 'AYU-JVARA', 'Duplicate')).rejects.toThrow();
  });

  it('should paginate list results and return total', async () => {
    await createCode(tenantA, 'A00', 'Alpha');
    await createCode(tenantA, 'B00', 'Bravo');
    await createCode(tenantA, 'C00', 'Charlie');
    const result = await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((entry) => entry.code)).toEqual(['C00']);
  });
});
