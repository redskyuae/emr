import { describe, expect, it } from 'vitest';

import {
  appointmentCancelledReasonIdSchema,
  appointmentCancelledReasonTenantIdSchema,
  createAppointmentCancelledReasonSchema,
} from './appointment-cancelled-reason-schema';

const errorsOf = (result: ReturnType<typeof createAppointmentCancelledReasonSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('AppointmentCancelledReason schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createAppointmentCancelledReasonSchema.safeParse({ code: 'CX' }))).toContain(
      'Appointment cancelled reason name is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(
      errorsOf(createAppointmentCancelledReasonSchema.safeParse({ name: '   ', code: 'CX' }))
    ).toContain('Appointment cancelled reason name cannot be empty');
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(
        createAppointmentCancelledReasonSchema.safeParse({ name: 'a'.repeat(101), code: 'CX' })
      )
    ).toContain('Appointment cancelled reason name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(
      errorsOf(createAppointmentCancelledReasonSchema.safeParse({ name: 'Cancelled' }))
    ).toContain('Appointment cancelled reason code is required');
  });

  it('should return validation error when code is empty after trimming', () => {
    expect(
      errorsOf(createAppointmentCancelledReasonSchema.safeParse({ name: 'Cancelled', code: '   ' }))
    ).toContain('Appointment cancelled reason code cannot be empty');
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(
        createAppointmentCancelledReasonSchema.safeParse({
          name: 'Cancelled',
          code: 'A'.repeat(11),
        })
      )
    ).toContain('Appointment cancelled reason code must be at most 10 characters');
  });

  it('should uppercase code on successful parse', () => {
    expect(
      createAppointmentCancelledReasonSchema.parse({ name: 'Cancelled', code: 'cx' }).code
    ).toBe('CX');
  });

  it('should trim name/code/description on successful parse', () => {
    expect(
      createAppointmentCancelledReasonSchema.parse({
        name: ' Cancelled ',
        code: ' cx ',
        description: ' Patient ',
      })
    ).toEqual({
      name: 'Cancelled',
      code: 'CX',
      description: 'Patient',
    });
  });

  it('should transform empty description to undefined', () => {
    expect(
      createAppointmentCancelledReasonSchema.parse({
        name: 'Cancelled',
        code: 'CX',
        description: '   ',
      }).description
    ).toBeUndefined();
  });

  it('should return validation error when description exceeds 500 characters', () => {
    expect(
      errorsOf(
        createAppointmentCancelledReasonSchema.safeParse({
          name: 'Patient Request',
          code: 'PAT',
          description: 'a'.repeat(501),
        })
      )
    ).toContain('Appointment cancelled reason description must be at most 500 characters');
  });

  it('should validate appointment cancelled reason id is positive integer', () => {
    expect(appointmentCancelledReasonIdSchema.safeParse('1').success).toBe(true);
    expect(appointmentCancelledReasonIdSchema.safeParse('0').success).toBe(false);
    expect(appointmentCancelledReasonIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(appointmentCancelledReasonTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(appointmentCancelledReasonTenantIdSchema.safeParse('   ').success).toBe(false);
  });

  it('should reject unsupported characters in name and code', () => {
    expect(
      errorsOf(createAppointmentCancelledReasonSchema.safeParse({ name: 'In.Person', code: 'INP' }))
    ).toContain(
      'Appointment cancelled reason name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    );

    expect(
      errorsOf(
        createAppointmentCancelledReasonSchema.safeParse({ name: 'In Person', code: 'IN.P' })
      )
    ).toContain(
      'Appointment cancelled reason code must contain only letters, numbers, hyphens, and underscores.'
    );
  });
});
