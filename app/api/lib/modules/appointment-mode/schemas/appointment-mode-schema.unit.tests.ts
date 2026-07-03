import { describe, expect, it } from 'vitest';

import {
  appointmentModeIdSchema,
  appointmentModeTenantIdSchema,
  createAppointmentModeSchema,
} from './appointment-mode-schema';

const errorsOf = (result: ReturnType<typeof createAppointmentModeSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('AppointmentMode schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createAppointmentModeSchema.safeParse({ code: 'IP' }))).toContain(
      'Appointment mode name is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(errorsOf(createAppointmentModeSchema.safeParse({ name: '   ', code: 'IP' }))).toContain(
      'Appointment mode name cannot be empty'
    );
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(createAppointmentModeSchema.safeParse({ name: 'a'.repeat(101), code: 'IP' }))
    ).toContain('Appointment mode name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createAppointmentModeSchema.safeParse({ name: 'In Person' }))).toContain(
      'Appointment mode code is required'
    );
  });

  it('should return validation error when code is empty after trimming', () => {
    expect(
      errorsOf(createAppointmentModeSchema.safeParse({ name: 'In Person', code: '   ' }))
    ).toContain('Appointment mode code cannot be empty');
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(createAppointmentModeSchema.safeParse({ name: 'In Person', code: 'A'.repeat(11) }))
    ).toContain('Appointment mode code must be at most 10 characters');
  });

  it('should uppercase code on successful parse', () => {
    expect(createAppointmentModeSchema.parse({ name: 'In Person', code: 'ip' }).code).toBe('IP');
  });

  it('should trim name/code/description on successful parse', () => {
    expect(
      createAppointmentModeSchema.parse({
        name: ' In Person ',
        code: ' ip ',
        description: ' Clinic ',
      })
    ).toEqual({
      name: 'In Person',
      code: 'IP',
      description: 'Clinic',
    });
  });

  it('should transform empty description to undefined', () => {
    expect(
      createAppointmentModeSchema.parse({ name: 'In Person', code: 'IP', description: '   ' })
        .description
    ).toBeUndefined();
  });

  it('should validate appointment mode id is positive integer', () => {
    expect(appointmentModeIdSchema.safeParse('1').success).toBe(true);
    expect(appointmentModeIdSchema.safeParse('0').success).toBe(false);
    expect(appointmentModeIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(appointmentModeTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(appointmentModeTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
