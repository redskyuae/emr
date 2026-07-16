import { beforeEach, describe, expect, it } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
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
});
