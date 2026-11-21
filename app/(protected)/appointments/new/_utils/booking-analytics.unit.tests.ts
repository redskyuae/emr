import { describe, expect, it } from 'vitest';

import { EMPTY_BOOK_APPOINTMENT_FORM_VALUES as empty } from './book-appointment-form-schema';
import {
  bookingRejectionKind,
  chosenBookingPatient,
  completedBookingSteps,
} from './booking-analytics';

const consultation = {
  ...empty,
  patientId: '42',
  visitType: 'CONSULTATION' as const,
  doctorId: '7',
  appointmentModeId: '1',
  appointmentTypeId: '2',
  appointmentReasonId: '3',
  slotDate: '2026-11-21',
  doctorRotaId: '9',
  startTime: '09:00',
  endTime: '09:30',
};

const procedure = {
  ...empty,
  patientId: '42',
  visitType: 'PROCEDURE' as const,
  doctorId: 'not-applicable',
  selectionMode: 'EXISTING_PLAN' as const,
  patientTreatmentPlanId: '5',
  patientTreatmentPlanSessionId: 'session-1',
  slotDate: '2026-11-21',
  startTime: '10:00',
  endTime: '11:00',
  roomId: '3',
  therapistId: '8',
};

describe('completedBookingSteps', () => {
  it('should complete nothing on an empty booking', () => {
    expect(completedBookingSteps(empty)).toEqual([]);
  });

  it('should complete only the Patient step before a Booking Path is chosen', () => {
    expect(completedBookingSteps({ ...empty, patientId: '42' })).toEqual(['patient']);
  });

  it('should complete every Consultation step in screen order', () => {
    expect(completedBookingSteps(consultation)).toEqual([
      'patient',
      'doctor',
      'schedule',
      'details',
    ]);
  });

  it('should complete every Procedure step in screen order', () => {
    expect(completedBookingSteps(procedure)).toEqual([
      'patient',
      'treatment_session',
      'procedure_schedule',
      'resources',
    ]);
  });

  it('should not complete a schedule whose end is not after its start', () => {
    expect(completedBookingSteps({ ...consultation, endTime: '09:00' })).not.toContain('schedule');
    expect(completedBookingSteps({ ...procedure, startTime: '' })).not.toContain(
      'procedure_schedule'
    );
  });

  it('should not complete the Doctor step without a Doctor', () => {
    expect(completedBookingSteps({ ...consultation, doctorId: 'not-applicable' })).not.toContain(
      'doctor'
    );
  });

  it('should complete a catalogue Treatment selection once a Treatment is chosen', () => {
    const catalogue = {
      ...procedure,
      selectionMode: 'CATALOGUE' as const,
      patientTreatmentPlanId: '',
      patientTreatmentPlanSessionId: '',
    };

    expect(completedBookingSteps(catalogue)).not.toContain('treatment_session');
    expect(completedBookingSteps({ ...catalogue, treatmentId: '11' })).toContain(
      'treatment_session'
    );
  });

  it('should need both a Room and a Therapist for the resources step', () => {
    expect(completedBookingSteps({ ...procedure, therapistId: '' })).not.toContain('resources');
  });

  it('should complete a Provisional Patient only with a name and a valid UAE mobile', () => {
    const provisional = {
      ...empty,
      patientMode: 'provisional' as const,
      firstName: 'Asha',
      lastName: 'Nair',
      phone: '050 123 4567',
    };

    expect(completedBookingSteps(provisional)).toEqual(['patient']);
    expect(completedBookingSteps({ ...provisional, phone: '12345' })).toEqual([]);
    expect(completedBookingSteps({ ...provisional, lastName: ' ' })).toEqual([]);
  });
});

describe('chosenBookingPatient', () => {
  it('should be null until a Patient is chosen', () => {
    expect(chosenBookingPatient(empty)).toBeNull();
  });

  it('should key an existing Patient by the selection so a change is noticed', () => {
    expect(chosenBookingPatient({ ...empty, patientId: '42' })).toEqual({
      key: 'existing:42',
      kind: 'existing',
    });
    expect(chosenBookingPatient({ ...empty, patientId: '43' })?.key).toBe('existing:43');
  });

  it('should report a completed Provisional Patient as a new one', () => {
    expect(
      chosenBookingPatient({
        ...empty,
        patientMode: 'provisional',
        firstName: 'Asha',
        lastName: 'Nair',
        phone: '+971501234567',
      })
    ).toEqual({ key: 'provisional', kind: 'provisional_new' });
  });
});

describe('bookingRejectionKind', () => {
  it('should tell a duplicate Patient match apart from another conflict', () => {
    expect(bookingRejectionKind({ status: 409, hasPatientMatches: true })).toBe(
      'duplicate_patient_match'
    );
    expect(bookingRejectionKind({ status: 409, hasPatientMatches: false })).toBe('conflict');
  });

  it('should map access, validation and server failures', () => {
    expect(bookingRejectionKind({ status: 403, hasPatientMatches: false })).toBe('forbidden');
    expect(bookingRejectionKind({ status: 401, hasPatientMatches: false })).toBe('forbidden');
    expect(bookingRejectionKind({ status: 400, hasPatientMatches: false })).toBe('validation');
    expect(bookingRejectionKind({ status: 404, hasPatientMatches: false })).toBe('validation');
    expect(bookingRejectionKind({ status: 500, hasPatientMatches: false })).toBe('server_error');
  });

  it('should treat a failure without a status as a server error', () => {
    expect(bookingRejectionKind({ status: undefined, hasPatientMatches: false })).toBe(
      'server_error'
    );
  });
});
