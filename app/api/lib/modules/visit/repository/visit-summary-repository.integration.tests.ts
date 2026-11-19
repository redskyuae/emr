import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { allergen as allergenTable } from '@/app/db/schema/allergen';
import { organization, user } from '@/app/db/schema/auth';
import { clinicalNote as clinicalNoteTable } from '@/app/db/schema/clinical-note';
import { clinicalNoteType as clinicalNoteTypeTable } from '@/app/db/schema/clinical-note-type';
import { invoice as invoiceTable } from '@/app/db/schema/invoice';
import { patient as patientTable } from '@/app/db/schema/patient';
import { patientAllergy as patientAllergyTable } from '@/app/db/schema/patient-allergy';
import { patientVitalSign as patientVitalSignTable } from '@/app/db/schema/patient-vital-sign';
import { visit as visitTable } from '@/app/db/schema/visit';
import { visitType as visitTypeTable } from '@/app/db/schema/visit-type';
import { visitSummaryRepository } from './visit-summary-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

type Fixtures = { patientId: number; visitId: number; noteTypeId: number };

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
      firstName: 'Lakshmi',
      lastName: 'Raghavan',
      phone: '+971500004127',
      registrationStatus: 'registered',
    })
    .returning({ id: patientTable.id });
  const [visitType] = await db
    .insert(visitTypeTable)
    .values({ tenantId, name: 'OPD Consultation', code: `OPD${sequence}` })
    .returning({ id: visitTypeTable.id });
  const [visit] = await db
    .insert(visitTable)
    .values({
      tenantId,
      visitNumber: `VST-${1000 + sequence}`,
      patientId: patient.id,
      visitTypeId: visitType.id,
      visitDate: '2026-11-18',
      queueToken: 1,
    })
    .returning({ id: visitTable.id });
  const [noteType] = await db
    .insert(clinicalNoteTypeTable)
    .values({ tenantId, name: 'Doctor Consultation', code: 'CONS' })
    .returning({ id: clinicalNoteTypeTable.id });

  return { patientId: patient.id, visitId: visit.id, noteTypeId: noteType.id };
}

async function createAuthor(name: string) {
  const id = randomUUID();
  await db.insert(user).values({ id, name, email: `${id}@example.com` });
  return id;
}

describe('Visit summary repository', () => {
  let a: Fixtures;
  let b: Fixtures;

  beforeEach(async () => {
    a = await createFixtures(tenantA);
    b = await createFixtures(tenantB);
  });

  describe('getSignedVisitNotes', () => {
    it('should return only signed, undeleted notes of the Visit with type and author', async () => {
      const authorId = await createAuthor('Dr. Anjali Menon');
      const note = {
        tenantId: tenantA,
        patientId: a.patientId,
        visitId: a.visitId,
        noteTypeId: a.noteTypeId,
        authorUserId: authorId,
        recordedByUserId: authorId,
      };
      const signedAt = new Date('2026-11-18T06:39:00Z');
      await db.insert(clinicalNoteTable).values([
        { ...note, subjective: 'Signed', status: 'signed', signedAt },
        { ...note, subjective: 'Draft', status: 'draft' },
        { ...note, subjective: 'Deleted', status: 'signed', signedAt, isDeleted: true },
        { ...note, subjective: 'Other visit', status: 'signed', signedAt, visitId: null },
      ]);

      const notes = await visitSummaryRepository.getSignedVisitNotes(tenantA, a.visitId);

      expect(notes).toEqual([
        expect.objectContaining({
          subjective: 'Signed',
          signedAt,
          authorName: 'Dr. Anjali Menon',
          noteType: { name: 'Doctor Consultation', code: 'CONS' },
        }),
      ]);
    });

    it('should not return another Tenant notes for the same Visit ID', async () => {
      await db.insert(clinicalNoteTable).values({
        tenantId: tenantB,
        patientId: b.patientId,
        visitId: b.visitId,
        noteTypeId: b.noteTypeId,
        status: 'signed',
        signedAt: new Date(),
        authorUserId: 'user-1',
        recordedByUserId: 'user-1',
      });

      await expect(visitSummaryRepository.getSignedVisitNotes(tenantA, b.visitId)).resolves.toEqual(
        []
      );
    });
  });

  describe('getLatestVisitVitalSign', () => {
    it('should return the most recently recorded set of the Visit', async () => {
      const vital = {
        tenantId: tenantA,
        patientId: a.patientId,
        visitId: a.visitId,
        recordedByUserId: 'user-1',
      };
      await db.insert(patientVitalSignTable).values([
        { ...vital, systolic: 140, recordedAt: new Date('2026-11-18T06:00:00Z') },
        { ...vital, systolic: 132, recordedAt: new Date('2026-11-18T07:38:00Z') },
        {
          ...vital,
          systolic: 120,
          recordedAt: new Date('2026-11-18T08:00:00Z'),
          isDeleted: true,
        },
      ]);

      const latest = await visitSummaryRepository.getLatestVisitVitalSign(tenantA, a.visitId);

      expect(latest).toMatchObject({ systolic: 132 });
    });

    it('should return undefined across Tenants', async () => {
      await db.insert(patientVitalSignTable).values({
        tenantId: tenantB,
        patientId: b.patientId,
        visitId: b.visitId,
        systolic: 120,
        recordedByUserId: 'user-1',
      });

      await expect(
        visitSummaryRepository.getLatestVisitVitalSign(tenantA, b.visitId)
      ).resolves.toBeUndefined();
    });
  });

  describe('getActivePatientAllergies', () => {
    it('should return active allergies most severe first with the Allergen name', async () => {
      const [allergen] = await db
        .insert(allergenTable)
        .values({ tenantId: tenantA, name: 'Ibuprofen', code: 'IBU', category: 'DRUG' })
        .returning({ id: allergenTable.id });
      const allergy = { tenantId: tenantA, patientId: a.patientId, recordedByUserId: 'user-1' };
      await db.insert(patientAllergyTable).values([
        { ...allergy, substance: 'Sesame oil', reaction: 'itching', severity: 'mild' },
        { ...allergy, allergenId: allergen.id, reaction: 'skin rash', severity: 'moderate' },
        { ...allergy, substance: 'Penicillin', severity: 'severe', status: 'resolved' },
        { ...allergy, substance: 'Latex', severity: 'severe', isDeleted: true },
      ]);

      const allergies = await visitSummaryRepository.getActivePatientAllergies(
        tenantA,
        a.patientId
      );

      expect(
        allergies.map(({ name, reaction, severity }) => ({ name, reaction, severity }))
      ).toEqual([
        { name: 'Ibuprofen', reaction: 'skin rash', severity: 'moderate' },
        { name: 'Sesame oil', reaction: 'itching', severity: 'mild' },
      ]);
    });

    it('should not return another Tenant allergies', async () => {
      await db.insert(patientAllergyTable).values({
        tenantId: tenantB,
        patientId: b.patientId,
        substance: 'Dust',
        severity: 'mild',
        recordedByUserId: 'user-1',
      });

      await expect(
        visitSummaryRepository.getActivePatientAllergies(tenantA, b.patientId)
      ).resolves.toEqual([]);
    });
  });

  describe('getVisitInvoiceId', () => {
    it('should return the latest finalized Invoice of the Visit, skipping Void and Draft', async () => {
      const invoice = { tenantId: tenantA, patientId: a.patientId, visitId: a.visitId };
      const [paid] = await db
        .insert(invoiceTable)
        .values({ ...invoice, invoiceNumber: 'INV-1001', status: 'PAID' })
        .returning({ id: invoiceTable.id });
      await db.insert(invoiceTable).values({
        ...invoice,
        invoiceNumber: 'INV-1002',
        status: 'VOID',
        voidedAt: new Date(),
        voidReason: 'Raised twice',
      });
      await db
        .insert(invoiceTable)
        .values({ ...invoice, invoiceNumber: 'INV-1003', status: 'DRAFT' });

      await expect(visitSummaryRepository.getVisitInvoiceId(tenantA, a.visitId)).resolves.toBe(
        paid.id
      );
    });

    it('should return undefined when the Visit has only a Draft Invoice', async () => {
      await db.insert(invoiceTable).values({
        tenantId: tenantA,
        patientId: a.patientId,
        visitId: a.visitId,
        invoiceNumber: 'INV-1004',
        status: 'DRAFT',
      });

      await expect(
        visitSummaryRepository.getVisitInvoiceId(tenantA, a.visitId)
      ).resolves.toBeUndefined();
    });

    it('should return undefined for another Tenant Visit', async () => {
      await db.insert(invoiceTable).values({
        tenantId: tenantB,
        patientId: b.patientId,
        visitId: b.visitId,
        invoiceNumber: 'INV-2001',
        status: 'FINALIZED',
      });

      await expect(
        visitSummaryRepository.getVisitInvoiceId(tenantA, b.visitId)
      ).resolves.toBeUndefined();
    });
  });
});
