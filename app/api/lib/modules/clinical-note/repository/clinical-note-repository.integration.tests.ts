import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { organization, user } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import { admissionRepository } from '../../admission/repository/admission-repository';
import { admissionTypeRepository } from '../../admission-type/repository/admission-type-repository';
import { bedRepository } from '../../bed/repository/bed-repository';
import { clinicalNoteTypeRepository } from '../../clinical-note-type/repository/clinical-note-type-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { wardRepository } from '../../ward/repository/ward-repository';
import { clinicalNoteRepository } from './clinical-note-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

async function createPatient(tenantId: string) {
  return patientRepository.createPatient({
    tenantId,
    title: 'ms',
    firstName: 'Ada',
    lastName: 'Lovelace',
    gender: 'female',
    phone: '5551234567',
    dateOfBirth: '1990-01-01',
  });
}

async function createNoteType(tenantId: string) {
  return clinicalNoteTypeRepository.createClinicalNoteType({
    tenantId,
    name: 'Progress Note',
    code: 'PROG',
    description: undefined,
  });
}

// Builds the minimum graph an Admission needs so a note can be linked to it.
async function createAdmission(tenantId: string, patientId: number): Promise<number> {
  await db
    .insert(organization)
    .values({ id: tenantId, name: tenantId, slug: tenantId, createdAt: new Date() })
    .onConflictDoNothing();

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

  const ward = await wardRepository.createWard({
    tenantId,
    name: 'ICU',
    code: 'ICU',
    description: undefined,
  });
  const bed = await bedRepository.createBed({
    tenantId,
    wardId: ward.id,
    bedNumber: 'BED-001',
    status: 'AVAILABLE',
  });
  const admissionType = await admissionTypeRepository.createAdmissionType({
    tenantId,
    name: 'Emergency',
    code: 'EMER',
    description: undefined,
  });

  const admitted = await admissionRepository.admitPatient({
    tenantId,
    patientId,
    doctorId: doctor.id,
    admissionTypeId: admissionType.id,
    bedId: bed!.id,
    bedNumber: bed!.bedNumber,
  });

  if (!admitted.success) {
    throw new Error('Failed to create admission fixture');
  }

  return admitted.data.id;
}

describe('ClinicalNote repository', () => {
  let patientId: number;
  let noteTypeId: number;

  beforeEach(async () => {
    const patient = await createPatient(tenantA);
    patientId = patient.id;
    const noteType = await createNoteType(tenantA);
    noteTypeId = noteType.id;
  });

  const createNote = (tenantId: string) =>
    clinicalNoteRepository.createClinicalNote({
      tenantId,
      patientId,
      noteTypeId,
      subjective: 'Cough for 3 days',
      assessment: 'URTI',
      authorUserId: 'user-1',
      recordedByUserId: 'user-1',
    });

  it('should create a draft clinical note', async () => {
    const created = await createNote(tenantA);
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      patientId,
      noteTypeId,
      status: 'draft',
      signedAt: null,
    });
  });

  it('should list notes for a patient', async () => {
    await createNote(tenantA);
    await createNote(tenantA);
    const result = await clinicalNoteRepository.getClinicalNotes({ tenantId: tenantA, patientId });
    expect(result.total).toBe(2);
  });

  it('should not read a note from another tenant', async () => {
    const created = await createNote(tenantA);
    await expect(
      clinicalNoteRepository.getClinicalNoteById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should sign a note', async () => {
    const created = await createNote(tenantA);
    const signed = await clinicalNoteRepository.signClinicalNote(created.id, tenantA);
    expect(signed).toMatchObject({ status: 'signed' });
    expect(signed?.signedAt).toBeInstanceOf(Date);
  });

  it('should soft-delete a note', async () => {
    const created = await createNote(tenantA);
    await clinicalNoteRepository.deleteClinicalNote(created.id, tenantA);
    await expect(
      clinicalNoteRepository.getClinicalNoteById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should preserve the Admission link when an edit omits linkage fields', async () => {
    const admissionId = await createAdmission(tenantA, patientId);
    const created = await clinicalNoteRepository.createClinicalNote({
      tenantId: tenantA,
      patientId,
      admissionId,
      noteTypeId,
      subjective: 'Initial admission note',
      authorUserId: 'user-1',
      recordedByUserId: 'user-1',
    });

    const updated = await clinicalNoteRepository.updateClinicalNote(created.id, {
      tenantId: tenantA,
      noteTypeId,
      subjective: 'Edited from the chart',
    });

    expect(updated).toMatchObject({ admissionId, subjective: 'Edited from the chart' });
  });

  it('should honor an explicit Admission link on update', async () => {
    const admissionId = await createAdmission(tenantA, patientId);
    const created = await clinicalNoteRepository.createClinicalNote({
      tenantId: tenantA,
      patientId,
      noteTypeId,
      subjective: 'Standalone note',
      authorUserId: 'user-1',
      recordedByUserId: 'user-1',
    });
    expect(created.admissionId).toBeNull();

    const updated = await clinicalNoteRepository.updateClinicalNote(created.id, {
      tenantId: tenantA,
      noteTypeId,
      admissionId,
      subjective: 'Attached to the admission',
    });

    expect(updated).toMatchObject({ admissionId });
  });
});
