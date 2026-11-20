import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { organization, user } from '@/app/db/schema/auth';
import { clinicalNote as clinicalNoteTable } from '@/app/db/schema/clinical-note';
import { clinicalNoteType as clinicalNoteTypeTable } from '@/app/db/schema/clinical-note-type';
import { patient as patientTable } from '@/app/db/schema/patient';
import { patientVitalSign as patientVitalSignTable } from '@/app/db/schema/patient-vital-sign';
import { visit as visitTable } from '@/app/db/schema/visit';
import { visitType as visitTypeTable } from '@/app/db/schema/visit-type';
import { consolidatedPatientReportRepository } from './consolidated-patient-report-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

type Fixtures = { patientId: number; visitIds: [number, number]; noteTypeId: number };

let sequence = 0;

async function createFixtures(tenantId: string): Promise<Fixtures> {
  sequence += 1;
  await db
    .insert(organization)
    .values({ id: tenantId, name: tenantId, slug: tenantId, createdAt: new Date() })
    .onConflictDoNothing();
  const [patient] = await db
    .insert(patientTable)
    .values({
      tenantId,
      mrn: `MRN-${1000 + sequence}`,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+919447012345',
      registrationStatus: 'registered',
    })
    .returning({ id: patientTable.id });
  const [visitType] = await db
    .insert(visitTypeTable)
    .values({ tenantId, name: 'OPD Consultation', code: `OPD${sequence}` })
    .returning({ id: visitTypeTable.id });
  const visit = { tenantId, patientId: patient.id, visitTypeId: visitType.id };
  const [first, second] = await db
    .insert(visitTable)
    .values([
      {
        ...visit,
        visitNumber: `VST-${2000 + sequence}`,
        visitDate: '2026-11-03',
        queueToken: 1,
        // Only one active Visit per Patient, so the earlier one is closed.
        status: 'COMPLETED',
        completedAt: new Date('2026-11-03T07:00:00Z'),
      },
      { ...visit, visitNumber: `VST-${3000 + sequence}`, visitDate: '2026-11-10', queueToken: 1 },
    ])
    .returning({ id: visitTable.id });
  const [noteType] = await db
    .insert(clinicalNoteTypeTable)
    .values({ tenantId, name: 'Doctor Consultation', code: 'CONS' })
    .returning({ id: clinicalNoteTypeTable.id });

  return { patientId: patient.id, visitIds: [first.id, second.id], noteTypeId: noteType.id };
}

async function createAuthor(name: string) {
  const id = randomUUID();
  await db.insert(user).values({ id, name, email: `${id}@example.com` });
  return id;
}

describe('Consolidated Patient Report repository', () => {
  let a: Fixtures;
  let b: Fixtures;

  beforeEach(async () => {
    a = await createFixtures(tenantA);
    b = await createFixtures(tenantB);
  });

  describe('getSignedNotesForVisits', () => {
    it('should return signed, undeleted notes of every given Visit, oldest first', async () => {
      const authorId = await createAuthor('Dr. Lakshmi Menon');
      const note = {
        tenantId: tenantA,
        patientId: a.patientId,
        noteTypeId: a.noteTypeId,
        authorUserId: authorId,
        recordedByUserId: authorId,
        status: 'signed' as const,
      };
      await db.insert(clinicalNoteTable).values([
        {
          ...note,
          visitId: a.visitIds[1],
          assessment: 'Pain 6/10',
          signedAt: new Date('2026-11-10T06:00:00Z'),
        },
        {
          ...note,
          visitId: a.visitIds[0],
          assessment: 'Pain 8/10',
          signedAt: new Date('2026-11-03T06:00:00Z'),
        },
        { ...note, visitId: a.visitIds[0], assessment: 'Draft', status: 'draft' },
        {
          ...note,
          visitId: a.visitIds[0],
          assessment: 'Deleted',
          signedAt: new Date('2026-11-03T07:00:00Z'),
          isDeleted: true,
        },
      ]);

      const notes = await consolidatedPatientReportRepository.getSignedNotesForVisits(
        tenantA,
        a.visitIds
      );

      expect(notes).toEqual([
        expect.objectContaining({
          visitId: a.visitIds[0],
          assessment: 'Pain 8/10',
          authorName: 'Dr. Lakshmi Menon',
          noteType: { name: 'Doctor Consultation', code: 'CONS' },
        }),
        expect.objectContaining({ visitId: a.visitIds[1], assessment: 'Pain 6/10' }),
      ]);
    });

    it('should leave out Visits that were not asked for', async () => {
      await db.insert(clinicalNoteTable).values({
        tenantId: tenantA,
        patientId: a.patientId,
        visitId: a.visitIds[1],
        noteTypeId: a.noteTypeId,
        status: 'signed',
        signedAt: new Date(),
        authorUserId: 'user-1',
        recordedByUserId: 'user-1',
      });

      await expect(
        consolidatedPatientReportRepository.getSignedNotesForVisits(tenantA, [a.visitIds[0]])
      ).resolves.toEqual([]);
    });

    it('should not return another Tenant notes for the same Visit IDs', async () => {
      await db.insert(clinicalNoteTable).values({
        tenantId: tenantB,
        patientId: b.patientId,
        visitId: b.visitIds[0],
        noteTypeId: b.noteTypeId,
        status: 'signed',
        signedAt: new Date(),
        authorUserId: 'user-1',
        recordedByUserId: 'user-1',
      });

      await expect(
        consolidatedPatientReportRepository.getSignedNotesForVisits(tenantA, b.visitIds)
      ).resolves.toEqual([]);
    });

    it('should return nothing for no Visits', async () => {
      await expect(
        consolidatedPatientReportRepository.getSignedNotesForVisits(tenantA, [])
      ).resolves.toEqual([]);
    });
  });

  describe('getLatestPainScoresForVisits', () => {
    it('should return the latest recorded pain score of each Visit', async () => {
      const vital = { tenantId: tenantA, patientId: a.patientId, recordedByUserId: 'user-1' };
      await db.insert(patientVitalSignTable).values([
        {
          ...vital,
          visitId: a.visitIds[0],
          painScore: 8,
          recordedAt: new Date('2026-11-03T05:00:00Z'),
        },
        {
          ...vital,
          visitId: a.visitIds[0],
          painScore: 7,
          recordedAt: new Date('2026-11-03T06:00:00Z'),
        },
        // A later set without a pain score keeps the earlier score.
        {
          ...vital,
          visitId: a.visitIds[0],
          systolic: 130,
          recordedAt: new Date('2026-11-03T07:00:00Z'),
        },
        {
          ...vital,
          visitId: a.visitIds[1],
          painScore: 2,
          recordedAt: new Date('2026-11-10T08:00:00Z'),
          isDeleted: true,
        },
        {
          ...vital,
          visitId: a.visitIds[1],
          painScore: 6,
          recordedAt: new Date('2026-11-10T06:00:00Z'),
        },
      ]);

      const scores = await consolidatedPatientReportRepository.getLatestPainScoresForVisits(
        tenantA,
        a.visitIds
      );

      expect(scores).toEqual(
        expect.arrayContaining([
          { visitId: a.visitIds[0], painScore: 7 },
          { visitId: a.visitIds[1], painScore: 6 },
        ])
      );
      expect(scores).toHaveLength(2);
    });

    it('should not return another Tenant pain scores for the same Visit IDs', async () => {
      await db.insert(patientVitalSignTable).values({
        tenantId: tenantB,
        patientId: b.patientId,
        visitId: b.visitIds[0],
        painScore: 5,
        recordedByUserId: 'user-1',
      });

      await expect(
        consolidatedPatientReportRepository.getLatestPainScoresForVisits(tenantA, b.visitIds)
      ).resolves.toEqual([]);
    });

    it('should return nothing for no Visits', async () => {
      await expect(
        consolidatedPatientReportRepository.getLatestPainScoresForVisits(tenantA, [])
      ).resolves.toEqual([]);
    });
  });
});
