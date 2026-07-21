import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { organization, user } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { patient as patientTable } from '@/app/db/schema/patient';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import { visitType as visitTypeTable } from '@/app/db/schema/visit-type';
import { visitRepository } from '../../visit/repository/visit-repository';
import { visitDocumentRepository } from './visit-document-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';
const TODAY = '2026-07-16';

let mrnSequence = 0;

async function createTenant(tenantId: string) {
  await db
    .insert(organization)
    .values({ id: tenantId, name: tenantId, slug: tenantId, createdAt: new Date() })
    .onConflictDoNothing();
}

async function createDoctor(tenantId: string) {
  const userId = randomUUID();
  await db.insert(user).values({ id: userId, name: 'Dr Mehta', email: `${userId}@example.com` });
  const [specialty] = await db
    .insert(specialtyTable)
    .values({ name: `Cardiology ${userId.slice(0, 6)}`, code: userId.slice(0, 6), tenantId })
    .returning({ id: specialtyTable.id });
  const [doctor] = await db
    .insert(doctorTable)
    .values({ tenantId, userId, specialtyId: specialty.id })
    .returning({ id: doctorTable.id });

  return doctor.id;
}

async function createPatient(tenantId: string) {
  mrnSequence += 1;
  const [patient] = await db
    .insert(patientTable)
    .values({
      tenantId,
      mrn: `MRN-${String(1000 + mrnSequence)}`,
      firstName: 'Asha',
      lastName: 'Rao',
      phone: '+91-9876543210',
      registrationStatus: 'registered',
    })
    .returning({ id: patientTable.id });

  return patient.id;
}

async function createVisitType(tenantId: string) {
  const [visitType] = await db
    .insert(visitTypeTable)
    .values({ tenantId, name: 'OPD Consultation', code: 'OPD' })
    .returning({ id: visitTypeTable.id });

  return visitType.id;
}

// A Walk-in check-in needs no Appointment statuses, so it is the cheapest way to
// produce a real Visit row for the document foreign key.
async function seedVisit(tenantId: string) {
  await createTenant(tenantId);
  const [doctorId, patientId, visitTypeId] = await Promise.all([
    createDoctor(tenantId),
    createPatient(tenantId),
    createVisitType(tenantId),
  ]);

  const result = await visitRepository.checkInVisit({
    tenantId,
    patientId,
    doctorId,
    visitTypeId,
    visitDate: TODAY,
    chiefComplaint: undefined,
    remarks: undefined,
  });

  if (!result.success) {
    throw new Error('Failed to seed visit');
  }

  return result.data.id;
}

const metadata = (fileName: string) => ({
  fileName,
  fileUrl: `https://blob.vercel-storage.com/tenants/x/visit-documents/${fileName}`,
  contentType: 'application/pdf',
  fileSize: 2048,
});

describe('VisitDocument repository', () => {
  beforeEach(() => {
    mrnSequence = 0;
  });

  it('should add and read back a document for a visit', async () => {
    const visitId = await seedVisit(tenantA);

    const created = await visitDocumentRepository.addDocument({
      tenantId: tenantA,
      visitId,
      ...metadata('referral.pdf'),
    });

    await expect(visitDocumentRepository.listByVisit(tenantA, visitId)).resolves.toEqual([
      expect.objectContaining({ id: created.id, visitId, fileName: 'referral.pdf' }),
    ]);
  });

  it('should not read documents belonging to another tenant', async () => {
    const visitId = await seedVisit(tenantA);
    await visitDocumentRepository.addDocument({ tenantId: tenantA, visitId, ...metadata('a.pdf') });

    await expect(visitDocumentRepository.listByVisit(tenantB, visitId)).resolves.toEqual([]);
  });

  it('should not find a document by id across tenants', async () => {
    const visitId = await seedVisit(tenantA);
    const created = await visitDocumentRepository.addDocument({
      tenantId: tenantA,
      visitId,
      ...metadata('a.pdf'),
    });

    await expect(visitDocumentRepository.findById(created.id, tenantB)).resolves.toBeUndefined();
  });

  it('should insert many documents in one call', async () => {
    const visitId = await seedVisit(tenantA);

    await visitDocumentRepository.insertMany(db, tenantA, visitId, [
      metadata('one.pdf'),
      metadata('two.pdf'),
    ]);

    await expect(visitDocumentRepository.listByVisit(tenantA, visitId)).resolves.toHaveLength(2);
  });

  it('should no-op when inserting an empty document list', async () => {
    const visitId = await seedVisit(tenantA);

    await visitDocumentRepository.insertMany(db, tenantA, visitId, []);

    await expect(visitDocumentRepository.listByVisit(tenantA, visitId)).resolves.toEqual([]);
  });

  it('should exclude soft-deleted documents from reads', async () => {
    const visitId = await seedVisit(tenantA);
    const created = await visitDocumentRepository.addDocument({
      tenantId: tenantA,
      visitId,
      ...metadata('a.pdf'),
    });

    await visitDocumentRepository.deleteDocument(created.id, tenantA);

    await expect(visitDocumentRepository.findById(created.id, tenantA)).resolves.toBeUndefined();
    await expect(visitDocumentRepository.listByVisit(tenantA, visitId)).resolves.toEqual([]);
  });

  it('should not soft-delete a document belonging to another tenant', async () => {
    const visitId = await seedVisit(tenantA);
    const created = await visitDocumentRepository.addDocument({
      tenantId: tenantA,
      visitId,
      ...metadata('a.pdf'),
    });

    await expect(
      visitDocumentRepository.deleteDocument(created.id, tenantB)
    ).resolves.toBeUndefined();
    await expect(visitDocumentRepository.findById(created.id, tenantA)).resolves.toBeDefined();
  });
});
