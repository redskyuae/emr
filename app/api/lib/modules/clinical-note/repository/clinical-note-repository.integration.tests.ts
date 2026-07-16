import { beforeEach, describe, expect, it } from 'vitest';

import { clinicalNoteTypeRepository } from '../../clinical-note-type/repository/clinical-note-type-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { clinicalNoteRepository } from './clinical-note-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

async function createPatient(tenantId: string) {
  return patientRepository.createPatient({
    tenantId,
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
});
