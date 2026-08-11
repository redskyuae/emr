import { beforeEach, describe, expect, it } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
import { patientAllergyRepository } from './patient-allergy-repository';

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

const createAllergy = (
  tenantId: string,
  patientId: number,
  overrides: Partial<{ substance: string; severity: 'mild' | 'moderate' | 'severe' }> = {}
) =>
  patientAllergyRepository.createPatientAllergy({
    tenantId,
    patientId,
    allergenId: undefined,
    substance: overrides.substance ?? 'Peanuts',
    reaction: 'Hives',
    severity: overrides.severity ?? 'moderate',
    status: 'active',
    notedOn: '2024-01-01',
    notes: 'Observed in clinic',
    recordedByUserId: 'user-1',
  });

describe('PatientAllergy repository', () => {
  let patientId: number;

  beforeEach(async () => {
    const patient = await createPatient(tenantA);
    patientId = patient.id;
  });

  it('should create an allergy for a patient', async () => {
    const created = await createAllergy(tenantA, patientId);
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      patientId,
      substance: 'Peanuts',
      severity: 'moderate',
      status: 'active',
      recordedByUserId: 'user-1',
    });
  });

  it('should list allergies for a patient in the tenant', async () => {
    await createAllergy(tenantA, patientId, { substance: 'Peanuts' });
    await createAllergy(tenantA, patientId, { substance: 'Shellfish' });
    const result = await patientAllergyRepository.getPatientAllergies({
      tenantId: tenantA,
      patientId,
    });
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('should not read an allergy from another tenant', async () => {
    const created = await createAllergy(tenantA, patientId);
    await expect(
      patientAllergyRepository.getPatientAllergyById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should soft-delete an allergy and hide it from reads', async () => {
    const created = await createAllergy(tenantA, patientId);
    await patientAllergyRepository.deletePatientAllergy(created.id, tenantA);
    await expect(
      patientAllergyRepository.getPatientAllergyById(created.id, tenantA)
    ).resolves.toBeUndefined();
    const result = await patientAllergyRepository.getPatientAllergies({
      tenantId: tenantA,
      patientId,
    });
    expect(result.total).toBe(0);
  });

  it('should update an allergy for the tenant', async () => {
    const created = await createAllergy(tenantA, patientId);
    const updated = await patientAllergyRepository.updatePatientAllergy(created.id, {
      tenantId: tenantA,
      allergenId: undefined,
      substance: 'Peanuts',
      reaction: 'Anaphylaxis',
      severity: 'severe',
      status: 'active',
      notedOn: undefined,
      notes: undefined,
    });
    expect(updated).toMatchObject({ severity: 'severe', reaction: 'Anaphylaxis' });
  });
});
