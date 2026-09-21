import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { db } from '@/app/db';
import { treatment as treatmentTable } from '@/app/db/schema/treatment';

import { treatmentRepository } from './treatment-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const session = {
  label: 'Session 1 of 1 · Abhyanga',
  procedure: 'Abhyanga',
  sessionNumber: 1,
  durationMinutes: 60,
  setupMinutes: 10,
  cleaningMinutes: 5,
};

const createTreatment = (tenantId: string, name: string, code: string) =>
  treatmentRepository.createTreatment({
    tenantId,
    name,
    code,
    durationMinutes: 60,
    setupMinutes: 10,
    cleaningMinutes: 5,
    description: `${name} desc`,
    roomType: 'Panchakarma room',
    therapistSkill: 'Abhyanga',
    sessions: [session],
  });

describe('Treatment repository', () => {
  it('should persist Repeatable structure and default count on creation', async () => {
    const created = await treatmentRepository.createTreatment({
      tenantId: tenantA,
      name: 'Repeatable',
      code: 'RPT',
      sessionStructure: 'REPEATABLE',
      defaultTotalSessions: 20,
      durationMinutes: 60,
      setupMinutes: 0,
      cleaningMinutes: 0,
      sessions: [session],
    });
    expect(created).toMatchObject({ sessionStructure: 'REPEATABLE', defaultTotalSessions: 20 });
  });

  it('should allow colliding legacy names and codes but enforce active source identities', async () => {
    const data = {
      tenantId: tenantA,
      name: 'Legacy',
      code: 'LEG',
      sessionStructure: 'REPEATABLE' as const,
      legacySourceSystem: 'DHATHRI',
    };
    const [first] = await db
      .insert(treatmentTable)
      .values({ ...data, legacySourceIdentity: 'LEG_First' })
      .returning();
    await db.insert(treatmentTable).values({ ...data, legacySourceIdentity: 'LEG_Second' });
    await expect(
      db.insert(treatmentTable).values({ ...data, legacySourceIdentity: 'leg_first' })
    ).rejects.toThrow();
    await expect(
      db
        .insert(treatmentTable)
        .values({ ...data, tenantId: tenantB, legacySourceIdentity: 'leg_first' })
        .returning()
    ).resolves.toHaveLength(1);
    await db.update(treatmentTable).set({ isDeleted: true }).where(eq(treatmentTable.id, first.id));
    await expect(
      db
        .insert(treatmentTable)
        .values({ ...data, legacySourceIdentity: 'leg_first' })
        .returning()
    ).resolves.toHaveLength(1);
    await expect(treatmentRepository.getTreatmentById(first.id, tenantA)).resolves.toBeUndefined();
  });

  it('should preserve unknown legacy timing and default native rows to Sequenced', async () => {
    const [native] = await db
      .insert(treatmentTable)
      .values({ tenantId: tenantA, name: 'Native', code: 'NAT' })
      .returning();
    expect(native.sessionStructure).toBe('SEQUENCED');
    await expect(treatmentRepository.getTreatmentById(native.id, tenantA)).resolves.toMatchObject({
      durationMinutes: null,
      setupMinutes: null,
      cleaningMinutes: null,
    });
  });

  it('should exclude legacy identities from native name and code uniqueness checks', async () => {
    await db.insert(treatmentTable).values({
      tenantId: tenantA,
      name: 'Legacy',
      code: 'LEG',
      legacySourceIdentity: 'LEG_Legacy',
      legacySourceSystem: 'DHATHRI',
      sessionStructure: 'REPEATABLE',
    });
    await expect(treatmentRepository.findActiveByName(tenantA, 'Legacy')).resolves.toBeUndefined();
    await expect(treatmentRepository.findActiveByCode(tenantA, 'LEG')).resolves.toBeUndefined();
    await expect(createTreatment(tenantA, 'Legacy', 'LEG')).resolves.toMatchObject({
      legacySourceIdentity: null,
      sessionStructure: 'SEQUENCED',
    });
  });

  it('should create and read back a treatment with its sessions', async () => {
    const created = await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');

    await expect(treatmentRepository.getTreatmentById(created.id, tenantA)).resolves.toMatchObject({
      id: created.id,
      name: 'Abhyanga wellness programme',
      code: 'TRT-0400',
      tenantId: tenantA,
      sessions: [expect.objectContaining({ sessionNumber: 1, procedure: 'Abhyanga' })],
    });
  });

  it('should not get a row created by another tenant', async () => {
    const created = await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');

    await expect(
      treatmentRepository.getTreatmentById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should exclude soft-deleted rows from reads', async () => {
    const created = await createTreatment(tenantA, 'Shirodhara relaxation programme', 'TRT-0401');

    await treatmentRepository.deleteTreatment(created.id, tenantA);

    await expect(
      treatmentRepository.getTreatmentById(created.id, tenantA)
    ).resolves.toBeUndefined();
    await expect(
      treatmentRepository.getTreatmentSessionById(created.sessions[0].id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should not soft-delete a row belonging to another tenant', async () => {
    const created = await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');

    await expect(treatmentRepository.deleteTreatment(created.id, tenantB)).resolves.toBeUndefined();
    await expect(treatmentRepository.getTreatmentById(created.id, tenantA)).resolves.toBeDefined();
  });

  it('should update a treatment within the tenant', async () => {
    const created = await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');

    const updated = await treatmentRepository.updateTreatment(created.id, {
      tenantId: tenantA,
      name: 'Abhyanga programme',
      code: 'TRT-0402',
      durationMinutes: 45,
      setupMinutes: 5,
      cleaningMinutes: 5,
      description: undefined,
    });

    expect(updated).toMatchObject({
      name: 'Abhyanga programme',
      code: 'TRT-0402',
      durationMinutes: 45,
      sessions: [expect.objectContaining({ sessionNumber: 1 })],
    });
  });

  it('should not update a row belonging to another tenant', async () => {
    const created = await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');

    await expect(
      treatmentRepository.updateTreatment(created.id, {
        tenantId: tenantB,
        name: 'Hijacked',
        code: 'HJK',
        durationMinutes: 60,
        setupMinutes: 0,
        cleaningMinutes: 0,
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should reject a duplicate name within a tenant case-insensitively', async () => {
    await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');

    await expect(
      createTreatment(tenantA, 'abhyanga wellness programme', 'TRT-0402')
    ).rejects.toThrow();
  });

  it('should reject a duplicate code within a tenant case-insensitively', async () => {
    await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');

    await expect(createTreatment(tenantA, 'Another Name', 'trt-0400')).rejects.toThrow();
  });

  it('should allow the same name and code in a different tenant', async () => {
    await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');

    await expect(
      createTreatment(tenantB, 'Abhyanga wellness programme', 'TRT-0400')
    ).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing the name of a soft-deleted treatment', async () => {
    const created = await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');
    await treatmentRepository.deleteTreatment(created.id, tenantA);

    await expect(
      createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400')
    ).resolves.toMatchObject({
      name: 'Abhyanga wellness programme',
    });
  });

  it('should find an active treatment by name case-insensitively', async () => {
    await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');

    await expect(
      treatmentRepository.findActiveByName(tenantA, 'abhyanga wellness programme')
    ).resolves.toMatchObject({ code: 'TRT-0400' });
    await expect(
      treatmentRepository.findActiveByName(tenantB, 'abhyanga wellness programme')
    ).resolves.toBeUndefined();
  });

  it('should exclude the given id from the uniqueness lookups', async () => {
    const created = await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');

    await expect(
      treatmentRepository.findActiveByName(tenantA, 'Abhyanga wellness programme', {
        excludeId: created.id,
      })
    ).resolves.toBeUndefined();
    await expect(
      treatmentRepository.findActiveByCode(tenantA, 'TRT-0400', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });

  it('should list only the tenant rows ordered by name with pagination', async () => {
    await createTreatment(tenantA, 'Shirodhara relaxation programme', 'TRT-0401');
    await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');
    await createTreatment(tenantA, 'Pizhichil programme', 'TRT-0402');
    await createTreatment(tenantB, 'Other Tenant', 'OTH');

    const firstPage = await treatmentRepository.getTreatments({
      tenantId: tenantA,
      page: 1,
      limit: 2,
    });

    expect(firstPage.total).toBe(3);
    expect(firstPage.data.map((row) => row.name)).toEqual([
      'Abhyanga wellness programme',
      'Pizhichil programme',
    ]);
    expect(firstPage.data[0].sessions).toHaveLength(1);

    const secondPage = await treatmentRepository.getTreatments({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });

    expect(secondPage.data.map((row) => row.name)).toEqual(['Shirodhara relaxation programme']);
  }, 20_000);

  it('should search by name and code', async () => {
    await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');
    await createTreatment(tenantA, 'Shirodhara relaxation programme', 'TRT-0401');

    const byName = await treatmentRepository.getTreatments({
      tenantId: tenantA,
      query: 'abhyanga',
    });
    const byCode = await treatmentRepository.getTreatments({
      tenantId: tenantA,
      query: '0401',
    });

    expect(byName.data.map((row) => row.code)).toEqual(['TRT-0400']);
    expect(byCode.data.map((row) => row.code)).toEqual(['TRT-0401']);
  });

  it('should skip seeding a treatment whose code already exists', async () => {
    await createTreatment(tenantA, 'Abhyanga wellness programme', 'TRT-0400');

    await treatmentRepository.seedDefaultTreatments(tenantA, [
      {
        name: 'Abhyanga duplicate',
        code: 'TRT-0400',
        durationMinutes: 30,
        setupMinutes: 0,
        cleaningMinutes: 0,
        sessions: [session],
      },
    ]);

    const listed = await treatmentRepository.getTreatments({ tenantId: tenantA, limit: 10 });

    expect(listed.total).toBe(1);
    expect(listed.data[0].name).toBe('Abhyanga wellness programme');
  });
});
