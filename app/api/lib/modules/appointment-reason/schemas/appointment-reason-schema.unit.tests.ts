import { describe, expect, it } from 'vitest';

import {
  appointmentReasonIdSchema,
  appointmentReasonTenantIdSchema,
  createAppointmentReasonSchema,
} from './appointment-reason-schema';

const errorsOf = (result: ReturnType<typeof createAppointmentReasonSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('AppointmentReason schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createAppointmentReasonSchema.safeParse({ code: 'CHK' }))).toContain(
      'Appointment reason name is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(
      errorsOf(createAppointmentReasonSchema.safeParse({ name: '   ', code: 'CHK' }))
    ).toContain('Appointment reason name cannot be empty');
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(createAppointmentReasonSchema.safeParse({ name: 'a'.repeat(101), code: 'CHK' }))
    ).toContain('Appointment reason name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createAppointmentReasonSchema.safeParse({ name: 'Checkup' }))).toContain(
      'Appointment reason code is required'
    );
  });

  it('should return validation error when code is empty after trimming', () => {
    expect(
      errorsOf(createAppointmentReasonSchema.safeParse({ name: 'Checkup', code: '   ' }))
    ).toContain('Appointment reason code cannot be empty');
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(createAppointmentReasonSchema.safeParse({ name: 'Checkup', code: 'A'.repeat(11) }))
    ).toContain('Appointment reason code must be at most 10 characters');
  });

  it('should uppercase code on successful parse', () => {
    expect(createAppointmentReasonSchema.parse({ name: 'Checkup', code: 'chk' }).code).toBe('CHK');
  });

  it('should trim name/code/description on successful parse', () => {
    expect(
      createAppointmentReasonSchema.parse({
        name: ' Checkup ',
        code: ' chk ',
        description: ' Routine ',
      })
    ).toEqual({
      name: 'Checkup',
      code: 'CHK',
      description: 'Routine',
    });
  });

  it('should transform empty description to undefined', () => {
    expect(
      createAppointmentReasonSchema.parse({ name: 'Checkup', code: 'CHK', description: '   ' })
        .description
    ).toBeUndefined();
  });

  it('should validate appointment reason id is positive integer', () => {
    expect(appointmentReasonIdSchema.safeParse('1').success).toBe(true);
    expect(appointmentReasonIdSchema.safeParse('0').success).toBe(false);
    expect(appointmentReasonIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(appointmentReasonTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(appointmentReasonTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
