import { beforeEach, describe, expect, it } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
import { patientProblemRepository } from './patient-problem-repository';

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

const createProblem = (tenantId: string, patientId: number, title = 'Hypertension') =>
  patientProblemRepository.createPatientProblem({
    tenantId,
    patientId,
    title,
    clinicalStatus: 'active',
    recordedByUserId: 'user-1',
  });

describe('PatientProblem repository', () => {
  let patientId: number;

  beforeEach(async () => {
    const patient = await createPatient(tenantA);
    patientId = patient.id;
  });

  it('should create a problem for a patient', async () => {
    const created = await createProblem(tenantA, patientId);
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      patientId,
      title: 'Hypertension',
      clinicalStatus: 'active',
    });
  });

  it('should list problems for a patient in the tenant', async () => {
    await createProblem(tenantA, patientId, 'Hypertension');
    await createProblem(tenantA, patientId, 'Asthma');
    const result = await patientProblemRepository.getPatientProblems({
      tenantId: tenantA,
      patientId,
    });
    expect(result.total).toBe(2);
  });

  it('should not read a problem from another tenant', async () => {
    const created = await createProblem(tenantA, patientId);
    await expect(
      patientProblemRepository.getPatientProblemById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should soft-delete a problem', async () => {
    const created = await createProblem(tenantA, patientId);
    await patientProblemRepository.deletePatientProblem(created.id, tenantA);
    await expect(
      patientProblemRepository.getPatientProblemById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update a problem to resolved with a resolved date', async () => {
    const created = await createProblem(tenantA, patientId);
    const updated = await patientProblemRepository.updatePatientProblem(created.id, {
      tenantId: tenantA,
      title: 'Hypertension',
      clinicalStatus: 'resolved',
      resolvedDate: '2024-06-01',
    });
    expect(updated).toMatchObject({ clinicalStatus: 'resolved', resolvedDate: '2024-06-01' });
  });
});
