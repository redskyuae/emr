import { describe, expect, it } from 'vitest';

import { diagnosisCodeRepository } from '../../diagnosis-code/repository/diagnosis-code-repository';
import { ayurvedaDiagnosisCodeRepository } from './ayurveda-diagnosis-code-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createIcdCode = (tenantId: string, code = 'M06.9') =>
  diagnosisCodeRepository.createDiagnosisCode({
    tenantId,
    code,
    title: 'Rheumatoid arthritis, unspecified',
    category: 'Musculoskeletal',
  });

const createAyurvedaCode = (
  tenantId: string,
  code: string,
  overrides: Partial<{ name: string; englishName: string; icdDiagnosisCodeId: number | null }> = {}
) =>
  ayurvedaDiagnosisCodeRepository.createAyurvedaDiagnosisCode({
    tenantId,
    code,
    name: overrides.name ?? 'Amavata',
    category: 'Vatavyadhi',
    englishName: overrides.englishName,
    icdDiagnosisCodeId: overrides.icdDiagnosisCodeId ?? null,
  });

describe('AyurvedaDiagnosisCode repository', () => {
  it('should create and read back a code with its joined ICD-10-CM mapping', async () => {
    const icd = await createIcdCode(tenantA);
    const created = await createAyurvedaCode(tenantA, 'AYU-AMV', {
      englishName: 'Rheumatoid arthritis',
      icdDiagnosisCodeId: icd.id,
    });

    expect(created).toMatchObject({
      code: 'AYU-AMV',
      name: 'Amavata',
      tenantId: tenantA,
      category: 'Vatavyadhi',
      englishName: 'Rheumatoid arthritis',
      icdDiagnosisCode: { id: icd.id, code: 'M06.9', title: 'Rheumatoid arthritis, unspecified' },
    });
    await expect(
      ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById(created!.id, tenantA)
    ).resolves.toEqual(created);
  });

  it('should return a null mapping when the code is unmapped', async () => {
    const created = await createAyurvedaCode(tenantA, 'AYU-JWR', { name: 'Jwara' });

    expect(created).toMatchObject({ englishName: null, icdDiagnosisCode: null });
  });

  it('should read the mapping as null once the mapped Diagnosis Code is deleted', async () => {
    const icd = await createIcdCode(tenantA);
    const created = await createAyurvedaCode(tenantA, 'AYU-AMV', { icdDiagnosisCodeId: icd.id });

    await diagnosisCodeRepository.deleteDiagnosisCode(icd.id, tenantA);

    await expect(
      ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById(created!.id, tenantA)
    ).resolves.toMatchObject({ icdDiagnosisCode: null });
  });

  it('should not read a row created by another Tenant', async () => {
    const created = await createAyurvedaCode(tenantA, 'AYU-AMV');

    await expect(
      ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById(created!.id, tenantB)
    ).resolves.toBeUndefined();
    await expect(
      ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({ tenantId: tenantB })
    ).resolves.toEqual({ data: [], total: 0 });
  });

  it('should update fields and the mapping, and not update across Tenants', async () => {
    const icd = await createIcdCode(tenantA);
    const created = await createAyurvedaCode(tenantA, 'AYU-AMV');
    const update = {
      code: 'AYU-AMV.1',
      name: 'Amavata (chronic)',
      category: undefined,
      englishName: 'Chronic rheumatoid arthritis',
      icdDiagnosisCodeId: icd.id,
    };

    await expect(
      ayurvedaDiagnosisCodeRepository.updateAyurvedaDiagnosisCode(created!.id, {
        ...update,
        tenantId: tenantB,
      })
    ).resolves.toBeUndefined();
    await expect(
      ayurvedaDiagnosisCodeRepository.updateAyurvedaDiagnosisCode(created!.id, {
        ...update,
        tenantId: tenantA,
      })
    ).resolves.toMatchObject({
      code: 'AYU-AMV.1',
      name: 'Amavata (chronic)',
      category: null,
      englishName: 'Chronic rheumatoid arthritis',
      icdDiagnosisCode: { id: icd.id, code: 'M06.9' },
    });
  });

  it('should soft delete and exclude deleted rows from reads', async () => {
    const created = await createAyurvedaCode(tenantA, 'AYU-AMV');

    await expect(
      ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(created!.id, tenantB)
    ).resolves.toBeUndefined();
    await expect(
      ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(created!.id, tenantA)
    ).resolves.toEqual({ id: created!.id });
    await expect(
      ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById(created!.id, tenantA)
    ).resolves.toBeUndefined();
    await expect(
      ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(created!.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive code uniqueness among active rows per Tenant', async () => {
    await createAyurvedaCode(tenantA, 'AYU-AMV');

    await expect(createAyurvedaCode(tenantA, 'ayu-amv')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'ayurveda_diagnosis_code_tenant_code_idx' },
    });
    await expect(createAyurvedaCode(tenantB, 'AYU-AMV')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing a code after the original is soft deleted', async () => {
    const created = await createAyurvedaCode(tenantA, 'AYU-AMV');
    await ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(created!.id, tenantA);

    await expect(createAyurvedaCode(tenantA, 'AYU-AMV')).resolves.toMatchObject({
      code: 'AYU-AMV',
    });
  });

  it('should find active codes case-insensitively and honour excludeId', async () => {
    const created = await createAyurvedaCode(tenantA, 'AYU-AMV');

    await expect(
      ayurvedaDiagnosisCodeRepository.findActiveByCode(tenantA, 'ayu-amv')
    ).resolves.toEqual({ id: created!.id });
    await expect(
      ayurvedaDiagnosisCodeRepository.findActiveByCode(tenantA, 'AYU-AMV', {
        excludeId: created!.id,
      })
    ).resolves.toBeUndefined();
  });

  it('should search code, name, and English name with pagination ordered by code', async () => {
    await createAyurvedaCode(tenantA, 'AYU-AMV', {
      name: 'Amavata',
      englishName: 'Rheumatoid arthritis',
    });
    await createAyurvedaCode(tenantA, 'AYU-JWR', { name: 'Jwara', englishName: 'Fever' });
    await createAyurvedaCode(tenantA, 'AYU-SAN', {
      name: 'Sandhivata',
      englishName: 'Osteoarthritis',
    });

    const byEnglishName = await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({
      tenantId: tenantA,
      query: 'arthritis',
    });
    expect(byEnglishName.total).toBe(2);
    expect(byEnglishName.data.map(({ code }) => code)).toEqual(['AYU-AMV', 'AYU-SAN']);

    await expect(
      ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({
        tenantId: tenantA,
        query: 'jwara',
      })
    ).resolves.toMatchObject({ total: 1, data: [{ code: 'AYU-JWR' }] });
    await expect(
      ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({ tenantId: tenantA, query: 'san' })
    ).resolves.toMatchObject({ total: 1, data: [{ code: 'AYU-SAN' }] });

    const secondPage = await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(secondPage.total).toBe(3);
    expect(secondPage.data.map(({ code }) => code)).toEqual(['AYU-SAN']);
  });
});
