import { describe, expect, it } from 'vitest';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';

import { getAppointmentVisitDefaults } from './appointment-visit-defaults';

const appointment = {
  bookingPath: 'PROCEDURE',
  treatment: { id: 10, name: 'Shirodhara', code: 'SHI' },
  treatmentSession: { id: 20, label: 'Session 2', sessionNumber: 2 },
  remarks: 'Continue treatment',
} as Appointment;

const visitTypes = [
  { id: 1, code: 'OPD' },
  { id: 2, code: 'PROC' },
] as VisitType[];

describe('getAppointmentVisitDefaults', () => {
  it('should prefill Visit details from a scheduled Treatment Appointment', () => {
    expect(getAppointmentVisitDefaults(appointment, visitTypes)).toEqual({
      visitTypeId: '2',
      chiefComplaint: 'Shirodhara · Session 2',
      remarks: 'Continue treatment',
    });
  });

  it('should leave Visit details empty for a Consultation Appointment or no selection', () => {
    expect(
      getAppointmentVisitDefaults({ ...appointment, bookingPath: 'CONSULTATION' }, visitTypes)
    ).toEqual({ visitTypeId: '', chiefComplaint: '', remarks: '' });
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
