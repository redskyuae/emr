import { describe, expect, expectTypeOf, it } from 'vitest';

import type { CreateAppointmentRequest } from './types';

describe('CreateAppointmentRequest', () => {
  it('should expose the strict Appointment wire contract', () => {
    const request = {
      bookingPath: 'PROCEDURE',
      patientId: 5,
      slotDate: '31-12-2099',
      startTime: '10:00',
      endTime: '11:15',
      patientTreatmentPlanId: 400,
      patientTreatmentPlanSessionId: 401,
    } satisfies CreateAppointmentRequest;

    expect(request.bookingPath).toBe('PROCEDURE');
  });

  it('should expose the catalogue assignment wire contract', () => {
    const request = {
      bookingPath: 'PROCEDURE',
      patientId: 5,
      slotDate: '31-12-2099',
      startTime: '10:00',
      endTime: '11:15',
      treatmentId: 400,
      totalSessions: 6,
    } satisfies CreateAppointmentRequest;

    expect(request.bookingPath).toBe('PROCEDURE');
  });

  it('should exclude mixed, partial, and Provisional Procedure requests from the contract', () => {
    expectTypeOf<{
      bookingPath: 'PROCEDURE';
      patientId: 5;
      slotDate: '31-12-2099';
      startTime: '10:00';
      endTime: '11:15';
      treatmentId: 400;
      patientTreatmentPlanId: 500;
      patientTreatmentPlanSessionId: 501;
    }>().not.toMatchTypeOf<CreateAppointmentRequest>();
    expectTypeOf<{
      bookingPath: 'PROCEDURE';
      patientId: 5;
      slotDate: '31-12-2099';
      startTime: '10:00';
      endTime: '11:15';
      patientTreatmentPlanId: 500;
    }>().not.toMatchTypeOf<CreateAppointmentRequest>();
    expectTypeOf<{
      bookingPath: 'PROCEDURE';
      provisionalPatient: { firstName: 'Asha'; lastName: 'Rao'; phone: '9876543210' };
      slotDate: '31-12-2099';
      startTime: '10:00';
      endTime: '11:15';
      treatmentId: 400;
    }>().not.toMatchTypeOf<CreateAppointmentRequest>();
  });

  it('should not expose server-owned Procedure snapshot fields', () => {
    expectTypeOf<{
      bookingPath: 'PROCEDURE';
      patientId: 5;
      slotDate: '31-12-2099';
      startTime: '10:00';
      endTime: '11:15';
      treatmentId: 400;
      treatmentSessionId: 401;
    }>().not.toMatchTypeOf<CreateAppointmentRequest>();
  });

  it('should preserve the Consultation Patient selector contract', () => {
    const request = {
      bookingPath: 'CONSULTATION',
      provisionalPatient: { firstName: 'Asha', lastName: 'Rao', phone: '9876543210' },
      doctorId: 1,
      appointmentModeId: 2,
      appointmentTypeId: 3,
      appointmentReasonId: 4,
      slotDate: '31-12-2099',
      doctorRotaId: 5,
      slotTimes: ['10:00'],
    } satisfies CreateAppointmentRequest;

    expect(request.bookingPath).toBe('CONSULTATION');
  });
});
