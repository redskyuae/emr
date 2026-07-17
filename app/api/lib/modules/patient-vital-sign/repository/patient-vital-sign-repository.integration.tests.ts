import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { organization, user } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import { admissionRepository } from '../../admission/repository/admission-repository';
import { admissionTypeRepository } from '../../admission-type/repository/admission-type-repository';
import { bedRepository } from '../../bed/repository/bed-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { wardRepository } from '../../ward/repository/ward-repository';
import { patientVitalSignRepository } from './patient-vital-sign-repository';

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

// Builds the minimum graph an Admission needs so a reading can be linked to it.
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

const createVitalSign = (tenantId: string, patientId: number, overrides = {}) =>
  patientVitalSignRepository.createPatientVitalSign({
    tenantId,
    patientId,
    recordedAt: new Date('2024-01-01T09:00:00Z'),
    heightCm: 170,
    weightKg: 70,
    bmi: 24.2,
    systolic: 120,
    diastolic: 80,
    pulseBpm: 72,
    recordedByUserId: 'user-1',
    ...overrides,
  });

describe('PatientVitalSign repository', () => {
  let patientId: number;

  beforeEach(async () => {
    const patient = await createPatient(tenantA);
    patientId = patient.id;
  });

  it('should create a vital sign for a patient', async () => {
    const created = await createVitalSign(tenantA, patientId);
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      patientId,
      systolic: 120,
      diastolic: 80,
      pulseBpm: 72,
    });
  });

  it('should list vital signs most-recent first', async () => {
    await createVitalSign(tenantA, patientId, {
      recordedAt: new Date('2024-01-01T09:00:00Z'),
      pulseBpm: 60,
    });
    await createVitalSign(tenantA, patientId, {
      recordedAt: new Date('2024-02-01T09:00:00Z'),
      pulseBpm: 80,
    });
    const result = await patientVitalSignRepository.getPatientVitalSigns({
      tenantId: tenantA,
      patientId,
    });
    expect(result.total).toBe(2);
    expect(result.data[0].pulseBpm).toBe(80);
  });

  it('should not read a vital sign from another tenant', async () => {
    const created = await createVitalSign(tenantA, patientId);
    await expect(
      patientVitalSignRepository.getPatientVitalSignById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should soft-delete a vital sign', async () => {
    const created = await createVitalSign(tenantA, patientId);
    await patientVitalSignRepository.deletePatientVitalSign(created.id, tenantA);
    await expect(
      patientVitalSignRepository.getPatientVitalSignById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update a vital sign', async () => {
    const created = await createVitalSign(tenantA, patientId);
    const updated = await patientVitalSignRepository.updatePatientVitalSign(created.id, {
      tenantId: tenantA,
      pulseBpm: 88,
      recordedAt: new Date('2024-03-01T09:00:00Z'),
    });
    expect(updated).toMatchObject({ pulseBpm: 88 });
  });

  it('should preserve the Admission link when an edit omits linkage fields', async () => {
    const admissionId = await createAdmission(tenantA, patientId);
    const created = await createVitalSign(tenantA, patientId, { admissionId });

    const updated = await patientVitalSignRepository.updatePatientVitalSign(created.id, {
      tenantId: tenantA,
      pulseBpm: 90,
    });

    expect(updated).toMatchObject({ admissionId, pulseBpm: 90 });
  });

  it('should honor an explicit Admission link on update', async () => {
    const admissionId = await createAdmission(tenantA, patientId);
    const created = await createVitalSign(tenantA, patientId);
    expect(created.admissionId).toBeNull();

    const updated = await patientVitalSignRepository.updatePatientVitalSign(created.id, {
      tenantId: tenantA,
      admissionId,
      pulseBpm: 95,
    });

    expect(updated).toMatchObject({ admissionId });
  });
});
