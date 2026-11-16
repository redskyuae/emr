import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { organization, user } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { patient as patientTable } from '@/app/db/schema/patient';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import { visitDiagnosis as visitDiagnosisTable } from '@/app/db/schema/visit-diagnosis';
import { visitType as visitTypeTable } from '@/app/db/schema/visit-type';
import { ayurvedaDiagnosisCodeRepository } from '../../ayurveda-diagnosis-code/repository/ayurveda-diagnosis-code-repository';
import { diagnosisCodeRepository } from '../../diagnosis-code/repository/diagnosis-code-repository';
import { visitRepository } from '../../visit/repository/visit-repository';
import type { VisitDiagnosisEntry } from '../schemas/visit-diagnosis-schema';
import { visitDiagnosisRepository } from './visit-diagnosis-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';
const TODAY = '2026-07-16';

let mrnSequence = 0;

async function seedVisit(tenantId: string) {
  await db
    .insert(organization)
    .values({ id: tenantId, name: tenantId, slug: tenantId, createdAt: new Date() })
    .onConflictDoNothing();

  const userId = randomUUID();
  await db.insert(user).values({ id: userId, name: 'Dr Nair', email: `${userId}@example.com` });
  const [specialty] = await db
    .insert(specialtyTable)
    .values({ name: `Kayachikitsa ${userId.slice(0, 6)}`, code: userId.slice(0, 6), tenantId })
    .returning({ id: specialtyTable.id });
  const [doctor] = await db
    .insert(doctorTable)
    .values({ tenantId, userId, specialtyId: specialty.id })
    .returning({ id: doctorTable.id });

  mrnSequence += 1;
  const [patient] = await db
    .insert(patientTable)
    .values({
      tenantId,
      mrn: `MRN-${String(1000 + mrnSequence)}`,
      firstName: 'Fatima',
      lastName: 'Al Mansoori',
      phone: '+971-501234567',
      registrationStatus: 'registered',
    })
    .returning({ id: patientTable.id });
  const [visitType] = await db
    .insert(visitTypeTable)
    .values({ tenantId, name: `OPD ${userId.slice(0, 6)}`, code: userId.slice(0, 6) })
    .returning({ id: visitTypeTable.id });

  const result = await visitRepository.checkInVisit({
    tenantId,
    patientId: patient.id,
    doctorId: doctor.id,
    visitTypeId: visitType.id,
    visitDate: TODAY,
    chiefComplaint: undefined,
    remarks: undefined,
  });

  if (!result.success) {
    throw new Error('Failed to seed visit');
  }

  return result.data.id;
}

async function seedCodes(tenantId: string) {
  const rheumatoid = await diagnosisCodeRepository.createDiagnosisCode({
    tenantId,
    code: 'M06.9',
    title: 'Rheumatoid arthritis, unspecified',
    category: 'Musculoskeletal',
  });
  const lowBackPain = await diagnosisCodeRepository.createDiagnosisCode({
    tenantId,
    code: 'M54.5',
    title: 'Low back pain',
    category: 'Musculoskeletal',
  });
  const amavata = await ayurvedaDiagnosisCodeRepository.createAyurvedaDiagnosisCode({
    tenantId,
    code: 'AYU-AMV',
    name: 'Amavata',
    category: 'Vatavyadhi',
    englishName: 'Rheumatoid arthritis',
    icdDiagnosisCodeId: rheumatoid.id,
  });
  const katishoola = await ayurvedaDiagnosisCodeRepository.createAyurvedaDiagnosisCode({
    tenantId,
    code: 'AYU-KTS',
    name: 'Katishoola',
    category: undefined,
    englishName: undefined,
    icdDiagnosisCodeId: null,
  });

  return { rheumatoid, lowBackPain, amavata: amavata!, katishoola: katishoola! };
}

const icd = (
  diagnosisCodeId: number,
  diagnosisType: VisitDiagnosisEntry['diagnosisType'],
  notes: string | null = null
): VisitDiagnosisEntry => ({
  codeSystem: 'ICD10CM',
  diagnosisCodeId,
  ayurvedaDiagnosisCodeId: null,
  diagnosisType,
  notes,
});

const ayurveda = (
  ayurvedaDiagnosisCodeId: number,
  diagnosisType: VisitDiagnosisEntry['diagnosisType']
): VisitDiagnosisEntry => ({
  codeSystem: 'AYURVEDA',
  diagnosisCodeId: null,
  ayurvedaDiagnosisCodeId,
  diagnosisType,
  notes: null,
});

describe('VisitDiagnosis repository', () => {
  beforeEach(() => {
    mrnSequence = 0;
  });

  it('should save a list and read it back ordered by code system, Principal, then position', async () => {
    const visitId = await seedVisit(tenantA);
    const codes = await seedCodes(tenantA);

    const saved = await visitDiagnosisRepository.replaceVisitDiagnoses(tenantA, visitId, [
      ayurveda(codes.katishoola.id, 'SECONDARY'),
      icd(codes.lowBackPain.id, 'SECONDARY', 'Since two weeks'),
      ayurveda(codes.amavata.id, 'PRINCIPAL'),
      icd(codes.rheumatoid.id, 'PRINCIPAL'),
    ]);

    expect(saved).toEqual([
      {
        id: expect.any(Number),
        visitId,
        codeSystem: 'ICD10CM',
        diagnosisType: 'PRINCIPAL',
        sortOrder: 4,
        notes: null,
        code: 'M06.9',
        title: 'Rheumatoid arthritis, unspecified',
        englishName: null,
        diagnosisCodeId: codes.rheumatoid.id,
        ayurvedaDiagnosisCodeId: null,
        icdMapping: null,
      },
      expect.objectContaining({
        code: 'M54.5',
        diagnosisType: 'SECONDARY',
        sortOrder: 2,
        notes: 'Since two weeks',
      }),
      {
        id: expect.any(Number),
        visitId,
        codeSystem: 'AYURVEDA',
        diagnosisType: 'PRINCIPAL',
        sortOrder: 3,
        notes: null,
        code: 'AYU-AMV',
        title: 'Amavata',
        englishName: 'Rheumatoid arthritis',
        diagnosisCodeId: null,
        ayurvedaDiagnosisCodeId: codes.amavata.id,
        icdMapping: {
          id: codes.rheumatoid.id,
          code: 'M06.9',
          title: 'Rheumatoid arthritis, unspecified',
        },
      },
      expect.objectContaining({ code: 'AYU-KTS', sortOrder: 1, icdMapping: null }),
    ]);
    await expect(visitDiagnosisRepository.listByVisit(tenantA, visitId)).resolves.toEqual(saved);
  });

  it('should replace the previous list and clear it with an empty list', async () => {
    const visitId = await seedVisit(tenantA);
    const codes = await seedCodes(tenantA);
    await visitDiagnosisRepository.replaceVisitDiagnoses(tenantA, visitId, [
      icd(codes.rheumatoid.id, 'PRINCIPAL'),
    ]);

    const replaced = await visitDiagnosisRepository.replaceVisitDiagnoses(tenantA, visitId, [
      icd(codes.lowBackPain.id, 'PRINCIPAL'),
    ]);
    expect(replaced.map(({ code }) => code)).toEqual(['M54.5']);

    await expect(
      visitDiagnosisRepository.replaceVisitDiagnoses(tenantA, visitId, [])
    ).resolves.toEqual([]);

    const allRows = await db.select().from(visitDiagnosisTable);
    expect(allRows).toHaveLength(2);
    expect(allRows.every(({ isDeleted, deletedOn }) => isDeleted && deletedOn)).toBe(true);
  });

  it('should roll back the whole replace when the new list breaks the Principal index', async () => {
    const visitId = await seedVisit(tenantA);
    const codes = await seedCodes(tenantA);
    await visitDiagnosisRepository.replaceVisitDiagnoses(tenantA, visitId, [
      icd(codes.rheumatoid.id, 'PRINCIPAL'),
    ]);

    await expect(
      visitDiagnosisRepository.replaceVisitDiagnoses(tenantA, visitId, [
        icd(codes.rheumatoid.id, 'PRINCIPAL'),
        icd(codes.lowBackPain.id, 'PRINCIPAL'),
      ])
    ).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'visit_diagnosis_tenant_visit_principal_idx' },
    });

    await expect(visitDiagnosisRepository.listByVisit(tenantA, visitId)).resolves.toMatchObject([
      { code: 'M06.9', diagnosisType: 'PRINCIPAL' },
    ]);
  });

  it('should allow one Principal per code system on the same Visit', async () => {
    const visitId = await seedVisit(tenantA);
    const codes = await seedCodes(tenantA);

    await expect(
      visitDiagnosisRepository.replaceVisitDiagnoses(tenantA, visitId, [
        icd(codes.rheumatoid.id, 'PRINCIPAL'),
        ayurveda(codes.amavata.id, 'PRINCIPAL'),
      ])
    ).resolves.toHaveLength(2);
  });

  it('should reject a row whose code id does not match its code system', async () => {
    const visitId = await seedVisit(tenantA);
    const codes = await seedCodes(tenantA);

    await expect(
      visitDiagnosisRepository.replaceVisitDiagnoses(tenantA, visitId, [
        { ...icd(codes.rheumatoid.id, 'PRINCIPAL'), ayurvedaDiagnosisCodeId: codes.amavata.id },
      ])
    ).rejects.toMatchObject({
      cause: { code: '23514', constraint: 'visit_diagnosis_code_reference_check' },
    });
  });

  it('should keep reading recorded codes after their master rows are deleted', async () => {
    const visitId = await seedVisit(tenantA);
    const codes = await seedCodes(tenantA);
    await visitDiagnosisRepository.replaceVisitDiagnoses(tenantA, visitId, [
      icd(codes.lowBackPain.id, 'PRINCIPAL'),
      ayurveda(codes.amavata.id, 'PRINCIPAL'),
    ]);

    await diagnosisCodeRepository.deleteDiagnosisCode(codes.lowBackPain.id, tenantA);
    await diagnosisCodeRepository.deleteDiagnosisCode(codes.rheumatoid.id, tenantA);
    await ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(codes.amavata.id, tenantA);

    await expect(visitDiagnosisRepository.listByVisit(tenantA, visitId)).resolves.toMatchObject([
      { code: 'M54.5', title: 'Low back pain' },
      { code: 'AYU-AMV', title: 'Amavata', englishName: 'Rheumatoid arthritis', icdMapping: null },
    ]);
  });

  it('should isolate Visit diagnoses by Tenant', async () => {
    const visitId = await seedVisit(tenantA);
    const codes = await seedCodes(tenantA);
    await visitDiagnosisRepository.replaceVisitDiagnoses(tenantA, visitId, [
      icd(codes.rheumatoid.id, 'PRINCIPAL'),
    ]);

    await expect(visitDiagnosisRepository.listByVisit(tenantB, visitId)).resolves.toEqual([]);

    await visitDiagnosisRepository.replaceVisitDiagnoses(tenantB, visitId, []);

    await expect(visitDiagnosisRepository.listByVisit(tenantA, visitId)).resolves.toHaveLength(1);
  });

  it('should look up master references in the Tenant including deleted rows', async () => {
    const codes = await seedCodes(tenantA);
    await diagnosisCodeRepository.deleteDiagnosisCode(codes.lowBackPain.id, tenantA);

    await expect(
      visitDiagnosisRepository.getDiagnosisCodeReferences(tenantA, [
        codes.rheumatoid.id,
        codes.lowBackPain.id,
      ])
    ).resolves.toEqual(
      expect.arrayContaining([
        { id: codes.rheumatoid.id, code: 'M06.9', isDeleted: false },
        { id: codes.lowBackPain.id, code: 'M54.5', isDeleted: true },
      ])
    );
    await expect(
      visitDiagnosisRepository.getDiagnosisCodeReferences(tenantB, [codes.rheumatoid.id])
    ).resolves.toEqual([]);
    await expect(
      visitDiagnosisRepository.getAyurvedaDiagnosisCodeReferences(tenantA, [codes.amavata.id])
    ).resolves.toEqual([{ id: codes.amavata.id, code: 'AYU-AMV', isDeleted: false }]);
    await expect(
      visitDiagnosisRepository.getAyurvedaDiagnosisCodeReferences(tenantA, [])
    ).resolves.toEqual([]);
  });
});
