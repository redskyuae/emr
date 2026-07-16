import { describe, expect, it } from 'vitest';

import {
  createPatientMedicationSchema,
  patientMedicationIdSchema,
} from './patient-medication-schema';

const errorsOf = (result: ReturnType<typeof createPatientMedicationSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('PatientMedication schema', () => {
  it('should require a drug name', () => {
    expect(errorsOf(createPatientMedicationSchema.safeParse({}))).toContain(
      'Medication drug name is required'
    );
  });

  it('should default status to active', () => {
    expect(createPatientMedicationSchema.parse({ drugName: 'Aspirin' }).status).toBe('active');
  });

  it('should reject an invalid status', () => {
    expect(
      errorsOf(createPatientMedicationSchema.safeParse({ drugName: 'Aspirin', status: 'paused' }))
    ).toContain('Medication status is invalid');
  });

  it('should reject an end date before the start date', () => {
    expect(
      errorsOf(
        createPatientMedicationSchema.safeParse({
          drugName: 'Aspirin',
          startDate: '2024-02-01',
          endDate: '2024-01-01',
        })
      )
    ).toContain('Medication end date must be on or after the start date');
  });

  it('should allow an end date equal to the start date', () => {
    expect(
      createPatientMedicationSchema.safeParse({
        drugName: 'Aspirin',
        startDate: '2024-01-01',
        endDate: '2024-01-01',
      }).success
    ).toBe(true);
  });

  it('should validate medication id is positive', () => {
    expect(patientMedicationIdSchema.safeParse('1').success).toBe(true);
    expect(patientMedicationIdSchema.safeParse('0').success).toBe(false);
  });
});
