import { describe, expect, it } from 'vitest';

import {
  appointmentStatusIdSchema,
  appointmentStatusTenantIdSchema,
  createAppointmentStatusSchema,
} from './appointment-status-schema';

const errorsOf = (result: ReturnType<typeof createAppointmentStatusSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('AppointmentStatus schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createAppointmentStatusSchema.safeParse({ code: 'SCH' }))).toContain(
      'Appointment status name is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(
      errorsOf(createAppointmentStatusSchema.safeParse({ name: '   ', code: 'SCH' }))
    ).toContain('Appointment status name cannot be empty');
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(createAppointmentStatusSchema.safeParse({ name: 'a'.repeat(101), code: 'SCH' }))
    ).toContain('Appointment status name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createAppointmentStatusSchema.safeParse({ name: 'Scheduled' }))).toContain(
      'Appointment status code is required'
    );
  });

  it('should return validation error when code is empty after trimming', () => {
    expect(
      errorsOf(createAppointmentStatusSchema.safeParse({ name: 'Scheduled', code: '   ' }))
    ).toContain('Appointment status code cannot be empty');
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(createAppointmentStatusSchema.safeParse({ name: 'Scheduled', code: 'A'.repeat(11) }))
    ).toContain('Appointment status code must be at most 10 characters');
  });

  it('should uppercase code on successful parse', () => {
    expect(
      createAppointmentStatusSchema.parse({ name: 'Scheduled', code: 'sch', category: 'SCHEDULED' })
        .code
    ).toBe('SCH');
  });

  it('should trim name/code/description on successful parse', () => {
    expect(
      createAppointmentStatusSchema.parse({
        name: ' Scheduled ',
        code: ' sch ',
        category: 'SCHEDULED',
        description: ' Clinic ',
      })
    ).toEqual({
      name: 'Scheduled',
      code: 'SCH',
      category: 'SCHEDULED',
      description: 'Clinic',
    });
  });

  it('should transform empty description to undefined', () => {
    expect(
      createAppointmentStatusSchema.parse({
        name: 'Scheduled',
        code: 'SCH',
        category: 'SCHEDULED',
        description: '   ',
      }).description
    ).toBeUndefined();
  });

  it('should validate category is a known lifecycle category', () => {
    expect(
      errorsOf(
        createAppointmentStatusSchema.safeParse({
          name: 'Scheduled',
          code: 'SCH',
          category: 'WAITING',
        })
      )
    ).toContain(
      'Appointment status category must be one of SCHEDULED, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, or NO_SHOW.'
    );
  });

  it('should validate appointment status id is positive integer', () => {
    expect(appointmentStatusIdSchema.safeParse('1').success).toBe(true);
    expect(appointmentStatusIdSchema.safeParse('0').success).toBe(false);
    expect(appointmentStatusIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(appointmentStatusTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(appointmentStatusTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
