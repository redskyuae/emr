import { describe, expect, it } from 'vitest';

import {
  appointmentTypeIdSchema,
  appointmentTypeTenantIdSchema,
  createAppointmentTypeSchema,
} from './appointment-type-schema';

const errorsOf = (result: ReturnType<typeof createAppointmentTypeSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('AppointmentType schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createAppointmentTypeSchema.safeParse({ code: 'IP' }))).toContain(
      'Appointment type name is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(errorsOf(createAppointmentTypeSchema.safeParse({ name: '   ', code: 'IP' }))).toContain(
      'Appointment type name cannot be empty'
    );
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(createAppointmentTypeSchema.safeParse({ name: 'a'.repeat(101), code: 'IP' }))
    ).toContain('Appointment type name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createAppointmentTypeSchema.safeParse({ name: 'In Person' }))).toContain(
      'Appointment type code is required'
    );
  });

  it('should return validation error when code is empty after trimming', () => {
    expect(
      errorsOf(createAppointmentTypeSchema.safeParse({ name: 'In Person', code: '   ' }))
    ).toContain('Appointment type code cannot be empty');
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(createAppointmentTypeSchema.safeParse({ name: 'In Person', code: 'A'.repeat(11) }))
    ).toContain('Appointment type code must be at most 10 characters');
  });

  it('should uppercase code on successful parse', () => {
    expect(createAppointmentTypeSchema.parse({ name: 'In Person', code: 'ip' }).code).toBe('IP');
  });

  it('should trim name/code/description on successful parse', () => {
    expect(
      createAppointmentTypeSchema.parse({
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
      createAppointmentTypeSchema.parse({ name: 'In Person', code: 'IP', description: '   ' })
        .description
    ).toBeUndefined();
  });

  it('should return validation error when description exceeds 500 characters', () => {
    expect(
      errorsOf(
        createAppointmentTypeSchema.safeParse({
          name: 'Consultation',
          code: 'CONS',
          description: 'a'.repeat(501),
        })
      )
    ).toContain('Appointment type description must be at most 500 characters');
  });

  it('should validate appointment type id is positive integer', () => {
    expect(appointmentTypeIdSchema.safeParse('1').success).toBe(true);
    expect(appointmentTypeIdSchema.safeParse('0').success).toBe(false);
    expect(appointmentTypeIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(appointmentTypeTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(appointmentTypeTenantIdSchema.safeParse('   ').success).toBe(false);
  });

  it('should reject unsupported characters in name and code', () => {
    expect(
      errorsOf(createAppointmentTypeSchema.safeParse({ name: 'In.Person', code: 'INP' }))
    ).toContain(
      'Appointment type name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    );

    expect(
      errorsOf(createAppointmentTypeSchema.safeParse({ name: 'In Person', code: 'IN.P' }))
    ).toContain(
      'Appointment type code must contain only letters, numbers, hyphens, and underscores.'
    );
  });
});
