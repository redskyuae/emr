import { beforeEach, describe, expect, it } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
import { patientMedicationRepository } from './patient-medication-repository';

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

const createMedication = (tenantId: string, patientId: number, drugName = 'Aspirin') =>
  patientMedicationRepository.createPatientMedication({
    tenantId,
    patientId,
    drugName,
    dose: '75 mg',
    route: 'oral',
    frequency: 'OD',
    status: 'active',
    startDate: '2024-01-01',
    recordedByUserId: 'user-1',
  });

describe('PatientMedication repository', () => {
  let patientId: number;

  beforeEach(async () => {
    const patient = await createPatient(tenantA);
    patientId = patient.id;
  });

  it('should create a medication for a patient', async () => {
    const created = await createMedication(tenantA, patientId);
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      patientId,
      drugName: 'Aspirin',
      dose: '75 mg',
      status: 'active',
    });
  });

  it('should list medications for a patient', async () => {
    await createMedication(tenantA, patientId, 'Aspirin');
    await createMedication(tenantA, patientId, 'Metformin');
    const result = await patientMedicationRepository.getPatientMedications({
      tenantId: tenantA,
      patientId,
    });
    expect(result.total).toBe(2);
  });

  it('should not read a medication from another tenant', async () => {
    const created = await createMedication(tenantA, patientId);
    await expect(
      patientMedicationRepository.getPatientMedicationById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should soft-delete a medication', async () => {
    const created = await createMedication(tenantA, patientId);
    await patientMedicationRepository.deletePatientMedication(created.id, tenantA);
    await expect(
      patientMedicationRepository.getPatientMedicationById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update a medication to stopped', async () => {
    const created = await createMedication(tenantA, patientId);
    const updated = await patientMedicationRepository.updatePatientMedication(created.id, {
      tenantId: tenantA,
      drugName: 'Aspirin',
      status: 'stopped',
      endDate: '2024-03-01',
    });
    expect(updated).toMatchObject({ status: 'stopped', endDate: '2024-03-01' });
  });
});
