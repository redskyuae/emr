import { describe, expect, it } from 'vitest';

import {
  createDoctorRotaSchema,
  doctorRotaIdSchema,
  doctorRotaTenantIdSchema,
} from './doctor-rota-schema';

const errorsOf = (result: ReturnType<typeof createDoctorRotaSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('DoctorRota schema', () => {
  it('should return validation error when name is missing', () => {
    expect(
      errorsOf(createDoctorRotaSchema.safeParse({ fromTime: '09:00', toTime: '13:00' }))
    ).toContain('Doctor rota name is required');
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(
      errorsOf(
        createDoctorRotaSchema.safeParse({ name: '   ', fromTime: '09:00', toTime: '13:00' })
      )
    ).toContain('Doctor rota name cannot be empty');
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(
        createDoctorRotaSchema.safeParse({
          name: 'a'.repeat(101),
          fromTime: '09:00',
          toTime: '13:00',
        })
      )
    ).toContain('Doctor rota name must be at most 100 characters');
  });

  it('should return validation error when from time is missing', () => {
    expect(
      errorsOf(createDoctorRotaSchema.safeParse({ name: 'Morning', toTime: '13:00' }))
    ).toContain('Doctor rota from time is required');
  });

  it('should return validation error when time format is invalid', () => {
    expect(
      errorsOf(
        createDoctorRotaSchema.safeParse({ name: 'Morning', fromTime: '9:00', toTime: '13:00' })
      )
    ).toContain('Doctor rota from time must be in HH:mm format');
  });

  it('should return validation error when to time is not after from time', () => {
    expect(
      errorsOf(
        createDoctorRotaSchema.safeParse({ name: 'Morning', fromTime: '13:00', toTime: '13:00' })
      )
    ).toContain('Doctor rota to time must be after from time');
    expect(
      errorsOf(
        createDoctorRotaSchema.safeParse({ name: 'Morning', fromTime: '14:00', toTime: '13:00' })
      )
    ).toContain('Doctor rota to time must be after from time');
  });

  it('should trim name and time values on successful parse', () => {
    expect(
      createDoctorRotaSchema.parse({
        name: ' Morning Rota ',
        fromTime: ' 09:00 ',
        toTime: ' 13:00 ',
      })
    ).toEqual({
      name: 'Morning Rota',
      fromTime: '09:00',
      toTime: '13:00',
    });
  });

  it('should validate doctor rota id is positive integer', () => {
    expect(doctorRotaIdSchema.safeParse('1').success).toBe(true);
    expect(doctorRotaIdSchema.safeParse('0').success).toBe(false);
    expect(doctorRotaIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(doctorRotaTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(doctorRotaTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
