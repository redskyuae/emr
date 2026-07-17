import { describe, expect, it } from 'vitest';

import {
  computeBmi,
  createPatientVitalSignSchema,
  patientVitalSignIdSchema,
} from './patient-vital-sign-schema';

const errorsOf = (result: ReturnType<typeof createPatientVitalSignSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('PatientVitalSign schema', () => {
  it('should require at least one measurement', () => {
    expect(errorsOf(createPatientVitalSignSchema.safeParse({}))).toContain(
      'At least one vital sign measurement is required'
    );
  });

  it('should accept a single measurement', () => {
    expect(createPatientVitalSignSchema.safeParse({ pulseBpm: 72 }).success).toBe(true);
  });

  it('should reject an out-of-range SpO2', () => {
    expect(errorsOf(createPatientVitalSignSchema.safeParse({ spo2: 150 }))).toContain(
      'Vital sign SpO2 must be at most 100'
    );
  });

  it('should reject an out-of-range pain score', () => {
    expect(errorsOf(createPatientVitalSignSchema.safeParse({ painScore: 11 }))).toContain(
      'Vital sign pain score must be at most 10'
    );
  });

  it('should reject a temperature below the physiological floor', () => {
    expect(errorsOf(createPatientVitalSignSchema.safeParse({ temperatureC: 10 }))).toContain(
      'Vital sign temperature must be at least 20'
    );
  });

  it('should coerce empty strings to undefined for optional measurements', () => {
    const parsed = createPatientVitalSignSchema.parse({ pulseBpm: 72, systolic: '' });
    expect(parsed.systolic).toBeUndefined();
  });

  it('should validate vital sign id is positive', () => {
    expect(patientVitalSignIdSchema.safeParse('1').success).toBe(true);
    expect(patientVitalSignIdSchema.safeParse('0').success).toBe(false);
  });

  it('should accept a visit or an admission parent alone', () => {
    expect(createPatientVitalSignSchema.safeParse({ pulseBpm: 72, visitId: 5 }).success).toBe(true);
    expect(createPatientVitalSignSchema.safeParse({ pulseBpm: 72, admissionId: 5 }).success).toBe(
      true
    );
  });

  it('should reject a record referencing both a visit and an admission', () => {
    expect(
      errorsOf(createPatientVitalSignSchema.safeParse({ pulseBpm: 72, visitId: 5, admissionId: 6 }))
    ).toContain('A record may reference a Visit or an Admission, not both.');
  });
});

describe('computeBmi', () => {
  it('should compute BMI to one decimal place', () => {
    expect(computeBmi(170, 70)).toBe(24.2);
  });

  it('should return undefined when height or weight is missing', () => {
    expect(computeBmi(undefined, 70)).toBeUndefined();
    expect(computeBmi(170, undefined)).toBeUndefined();
  });

  it('should return undefined when height is zero', () => {
    expect(computeBmi(0, 70)).toBeUndefined();
  });
});
