import { describe, expect, it } from 'vitest';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';

import { getAppointmentVisitDefaults, getWalkInVisitTypeId } from './appointment-visit-defaults';

const appointment = {
  bookingPath: 'PROCEDURE',
  treatment: { id: 10, name: 'Shirodhara', code: 'SHI' },
  treatmentSession: { id: 20, label: 'Session 2', sessionNumber: 2 },
  remarks: 'Continue treatment',
} as Appointment;

const visitTypes = [
  { id: 1, code: 'OPD' },
  { id: 2, code: 'PROC' },
  { id: 3, code: 'FUP' },
  { id: 4, code: 'EMER' },
  { id: 5, code: 'VAC' },
] as VisitType[];

describe('getAppointmentVisitDefaults', () => {
  it('should prefill Visit details from a scheduled Treatment Appointment', () => {
    expect(getAppointmentVisitDefaults(appointment, visitTypes)).toEqual({
      visitTypeId: '2',
      chiefComplaint: 'Shirodhara · Session 2',
      remarks: 'Continue treatment',
    });
  });

  it('should default a Doctor Consultation to OPD and copy its reason', () => {
    expect(
      getAppointmentVisitDefaults(
        {
          ...appointment,
          bookingPath: 'CONSULTATION',
          appointmentType: { id: 1, code: 'NEW', name: 'New Consultation' },
          appointmentReason: { id: 2, code: 'CONS', name: 'Consultation' },
        },
        visitTypes
      )
    ).toEqual({ visitTypeId: '1', chiefComplaint: 'Consultation', remarks: 'Continue treatment' });
  });

  it('should default a recent Doctor Consultation or explicit follow-up to Follow-up', () => {
    const consultation = { ...appointment, bookingPath: 'CONSULTATION' as const };
    expect(getAppointmentVisitDefaults(consultation, visitTypes, true).visitTypeId).toBe('3');
    expect(
      getAppointmentVisitDefaults(
        {
          ...consultation,
          appointmentType: { id: 3, code: 'FUP', name: 'Follow-up' },
        },
        visitTypes
      ).visitTypeId
    ).toBe('3');
    expect(
      getAppointmentVisitDefaults(
        {
          ...consultation,
          appointmentReason: { id: 3, code: 'RSLT', name: 'Results Review' },
        },
        visitTypes
      ).visitTypeId
    ).toBe('3');
  });

  it('should keep Emergency, Procedure, and Vaccination types ahead of the follow-up window', () => {
    const consultation = { ...appointment, bookingPath: 'CONSULTATION' as const };
    expect(
      getAppointmentVisitDefaults(
        { ...consultation, appointmentType: { id: 3, code: 'EMR', name: 'Emergency' } },
        visitTypes,
        true
      ).visitTypeId
    ).toBe('4');
    expect(
      getAppointmentVisitDefaults(
        { ...consultation, appointmentType: { id: 2, code: 'PROC', name: 'Procedure' } },
        visitTypes,
        true
      ).visitTypeId
    ).toBe('2');
    expect(
      getAppointmentVisitDefaults(
        { ...consultation, appointmentType: { id: 5, code: 'VAC', name: 'Vaccination' } },
        visitTypes,
        true
      ).visitTypeId
    ).toBe('5');
  });

  it('should default Walk-ins to OPD or Follow-up from prior Doctor Visits', () => {
    expect(getWalkInVisitTypeId(visitTypes, false)).toBe('1');
    expect(getWalkInVisitTypeId(visitTypes, true)).toBe('3');
  });

  it('should leave details empty without a selected Appointment', () => {
    expect(getAppointmentVisitDefaults(undefined, visitTypes)).toEqual({
      visitTypeId: '',
      chiefComplaint: '',
      remarks: '',
    });
  });

  it('should leave Visit type for staff to select when Procedure Visit type is unavailable', () => {
    expect(getAppointmentVisitDefaults(appointment, visitTypes.slice(0, 1))).toMatchObject({
      visitTypeId: '',
      chiefComplaint: 'Shirodhara · Session 2',
    });
  });
});
