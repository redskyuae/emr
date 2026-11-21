import { describe, expect, it } from 'vitest';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import {
  appointmentBookedProperties,
  appointmentCancelledProperties,
  appointmentRescheduledProperties,
} from './lifecycle-appointment-properties';

const now = new Date('2026-11-21T06:00:00Z');
const reference = (code: string) => ({ id: 3, name: code, code });

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 41,
    cancelledAt: null,
    remarks: null,
    rescheduleReason: null,
    rotaName: 'Morning',
    doctorRotaId: 7,
    tenantId: 'tenant-1',
    slotDate: '23-11-2026',
    startTime: '10:00',
    endTime: '10:30',
    bookingPath: 'CONSULTATION',
    bookingNumber: 'APT-1042',
    createdOn: now,
    doctor: { id: 12, name: 'Dr. Meera Nair' },
    patient: {
      id: 9,
      mrn: 'MRN-000123',
      phone: '+971501234567',
      lastName: 'Khan',
      firstName: 'Aisha',
      registrationStatus: 'registered',
    },
    appointmentMode: reference('IN_PERSON'),
    appointmentType: reference('NEW'),
    appointmentReason: reference('FOLLOW_UP'),
    appointmentCancelledReason: null,
    appointmentStatus: { ...reference('SCHEDULED'), category: 'scheduled' },
    treatment: null,
    treatmentSession: null,
    slots: [
      { status: 'Booked', slotTime: '10:00' },
      { status: 'Booked', slotTime: '10:15' },
    ],
    ...overrides,
  };
}

describe('appointmentBookedProperties', () => {
  it('should describe a Consultation for an existing Patient with codes, counts and flags only', () => {
    const properties = appointmentBookedProperties(
      { bookingPath: 'CONSULTATION', patientId: 9, remarks: 'Bring old reports' },
      makeAppointment({ remarks: 'Bring old reports' }),
      'Asia/Dubai',
      now
    );

    expect(properties).toEqual({
      booking_path: 'CONSULTATION',
      patient_kind: 'existing',
      appointment_mode_code: 'IN_PERSON',
      appointment_type_code: 'NEW',
      appointment_reason_code: 'FOLLOW_UP',
      slot_count: 2,
      lead_time_days: 2,
      is_same_day: false,
      procedure_source: undefined,
      has_doctor: true,
      has_remarks: true,
    });
  });

  it('should mark a booking that creates a Provisional Patient as provisional_new', () => {
    const properties = appointmentBookedProperties(
      { bookingPath: 'CONSULTATION', provisionalPatient: { firstName: 'Aisha' } },
      makeAppointment({ slotDate: '21-11-2026' }),
      'Asia/Dubai',
      now
    );

    expect(properties).toMatchObject({
      patient_kind: 'provisional_new',
      lead_time_days: 0,
      is_same_day: true,
    });
  });

  it('should tell an existing plan session from a catalogue Treatment for a Procedure', () => {
    const procedure = makeAppointment({
      bookingPath: 'PROCEDURE',
      doctor: null,
      appointmentMode: null,
      appointmentType: null,
      appointmentReason: null,
      slots: [],
    });

    expect(
      appointmentBookedProperties(
        { bookingPath: 'PROCEDURE', patientTreatmentPlanId: 4, patientTreatmentPlanSessionId: 8 },
        procedure,
        'Asia/Dubai',
        now
      )
    ).toMatchObject({
      booking_path: 'PROCEDURE',
      procedure_source: 'existing_plan',
      slot_count: undefined,
      appointment_mode_code: undefined,
      has_doctor: false,
      has_remarks: false,
    });
    expect(
      appointmentBookedProperties(
        { bookingPath: 'PROCEDURE', treatmentId: 5 },
        procedure,
        'Asia/Dubai',
        now
      )
    ).toMatchObject({ procedure_source: 'catalogue_treatment' });
  });
});

describe('appointmentRescheduledProperties', () => {
  it('should send the path, whether the Doctor changed and the lead time to the new date', () => {
    expect(
      appointmentRescheduledProperties(
        makeAppointment({ slotDate: '28-11-2026' }),
        true,
        'Asia/Dubai',
        now
      )
    ).toEqual({ booking_path: 'CONSULTATION', doctor_changed: true, lead_time_days: 7 });
  });
});

describe('appointmentCancelledProperties', () => {
  it('should send the Cancelled Reason code and the lead time for a Consultation', () => {
    expect(
      appointmentCancelledProperties(
        makeAppointment({ appointmentCancelledReason: reference('PATIENT_REQUEST') }),
        'Asia/Dubai',
        now
      )
    ).toEqual({
      booking_path: 'CONSULTATION',
      cancelled_reason_code: 'PATIENT_REQUEST',
      lead_time_days: 2,
      released_plan_session: false,
    });
  });

  it('should mark a cancelled Procedure as releasing its plan session', () => {
    expect(
      appointmentCancelledProperties(makeAppointment({ bookingPath: 'PROCEDURE' }), 'UTC', now)
    ).toMatchObject({ booking_path: 'PROCEDURE', released_plan_session: true });
  });
});
