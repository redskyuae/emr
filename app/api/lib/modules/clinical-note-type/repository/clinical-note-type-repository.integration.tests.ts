import { describe, expect, it } from 'vitest';

import { clinicalNoteTypeRepository } from './clinical-note-type-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createType = (tenantId: string, name: string, code: string) =>
  clinicalNoteTypeRepository.createClinicalNoteType({
    tenantId,
    name,
    code,
    description: `${name} description`,
  });

describe('ClinicalNoteType repository', () => {
  it('should create clinical note type for a tenant', async () => {
    const created = await createType(tenantA, 'Progress Note', 'PROG');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Progress Note',
      code: 'PROG',
      description: 'Progress Note description',
    });
  });

  it('should get clinical note type by id for same tenant', async () => {
    const created = await createType(tenantA, 'Consultation', 'CONS');
    await expect(
      clinicalNoteTypeRepository.getClinicalNoteTypeById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id, tenantId: tenantA });
  });

  it('should not get clinical note type by id for another tenant', async () => {
    const created = await createType(tenantA, 'Discharge Summary', 'DISCH');
    await expect(
      clinicalNoteTypeRepository.getClinicalNoteTypeById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only clinical note types for the requested tenant', async () => {
    await createType(tenantA, 'Progress Note', 'PROG');
    await createType(tenantB, 'Consultation', 'CONS');
    const result = await clinicalNoteTypeRepository.getClinicalNoteTypes({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted clinical note types', async () => {
    const deleted = await createType(tenantA, 'Progress Note', 'PROG');
    await clinicalNoteTypeRepository.deleteClinicalNoteType(deleted.id, tenantA);
    await createType(tenantA, 'Consultation', 'CONS');
    const result = await clinicalNoteTypeRepository.getClinicalNoteTypes({ tenantId: tenantA });
    expect(result.data.map((entry) => entry.code)).toEqual(['CONS']);
  });

  it('should soft-delete clinical note type and exclude it from future reads', async () => {
    const created = await createType(tenantA, 'Progress Note', 'PROG');
    await expect(
      clinicalNoteTypeRepository.deleteClinicalNoteType(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id });
    await expect(
      clinicalNoteTypeRepository.getClinicalNoteTypeById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it("should not delete another tenant's clinical note type", async () => {
    const created = await createType(tenantA, 'Progress Note', 'PROG');
    await expect(
      clinicalNoteTypeRepository.deleteClinicalNoteType(created.id, tenantB)
    ).resolves.toBeUndefined();
    await expect(
      clinicalNoteTypeRepository.getClinicalNoteTypeById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id });
  });

  it('should update only active clinical note type for the requested tenant', async () => {
    const created = await createType(tenantA, 'Progress Note', 'PROG');
    await expect(
      clinicalNoteTypeRepository.updateClinicalNoteType(created.id, {
        tenantId: tenantA,
        name: 'Consultation',
        code: 'CONS',
        description: undefined,
      })
    ).resolves.toMatchObject({ name: 'Consultation', code: 'CONS' });
    await clinicalNoteTypeRepository.deleteClinicalNoteType(created.id, tenantA);
    await expect(
      clinicalNoteTypeRepository.updateClinicalNoteType(created.id, {
        tenantId: tenantA,
        name: 'Progress Note',
        code: 'PROG',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createType(tenantA, 'Progress Note', 'PROG');
    await expect(createType(tenantA, 'progress note', 'PROG2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'clinical_note_type_tenant_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createType(tenantA, 'Progress Note', 'PROG');
    await expect(createType(tenantA, 'Consultation', 'prog')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'clinical_note_type_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createType(tenantA, 'Progress Note', 'PROG');
    await expect(createType(tenantB, 'Progress Note', 'PROG')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted', async () => {
    const created = await createType(tenantA, 'Progress Note', 'PROG');
    await clinicalNoteTypeRepository.deleteClinicalNoteType(created.id, tenantA);
    await expect(createType(tenantA, 'progress note', 'prog')).resolves.toMatchObject({
      name: 'progress note',
      code: 'prog',
    });
  });

  it('should search by name and code', async () => {
    await createType(tenantA, 'Progress Note', 'PROG');
    await createType(tenantA, 'Consultation', 'CONS');
    expect(
      (
        await clinicalNoteTypeRepository.getClinicalNoteTypes({
          tenantId: tenantA,
          query: 'consult',
        })
      ).data.map((entry) => entry.code)
    ).toEqual(['CONS']);
  });

  it('should paginate list results and return total', async () => {
    await createType(tenantA, 'Alpha', 'A');
    await createType(tenantA, 'Bravo', 'B');
    await createType(tenantA, 'Charlie', 'C');
    const result = await clinicalNoteTypeRepository.getClinicalNoteTypes({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((entry) => entry.name)).toEqual(['Charlie']);
  });
});
