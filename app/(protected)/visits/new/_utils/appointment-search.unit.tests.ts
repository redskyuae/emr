import { describe, expect, it } from 'vitest';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';

import { searchAppointments } from './appointment-search';

function appointment(overrides: Partial<Appointment>) {
  return {
    bookingNumber: 'APT-2026-0001',
    patient: {
      id: 1,
      firstName: 'Asha',
      lastName: 'Rao',
      mrn: 'MRN-1042',
      phone: '9000000001',
      registrationStatus: 'registered',
    },
    doctor: { id: 3, name: 'Dr. Kavya Menon' },
    therapist: null,
    ...overrides,
  } as Appointment;
}

const asha = appointment({});
const ravi = appointment({
  bookingNumber: 'APT-2026-0002',
  patient: {
    id: 2,
    firstName: 'Ravi',
    lastName: 'Kumar',
    mrn: 'MRN-2077',
    phone: '9888800002',
    registrationStatus: 'registered',
  },
  doctor: null,
  therapist: { id: 9, name: 'Lakshmi Pillai' },
});

describe('searchAppointments', () => {
  it('should return every Appointment for a blank query', () => {
    expect(searchAppointments([asha, ravi], '   ')).toEqual([asha, ravi]);
  });

  it('should match the booking number, MRN and phone case-insensitively', () => {
    expect(searchAppointments([asha, ravi], 'apt-2026-0002')).toEqual([ravi]);
    expect(searchAppointments([asha, ravi], 'mrn-1042')).toEqual([asha]);
    expect(searchAppointments([asha, ravi], '98888')).toEqual([ravi]);
  });

  it('should match the Patient full name and the Doctor or Therapist', () => {
    expect(searchAppointments([asha, ravi], 'Asha Rao')).toEqual([asha]);
    expect(searchAppointments([asha, ravi], 'menon')).toEqual([asha]);
    expect(searchAppointments([asha, ravi], 'lakshmi')).toEqual([ravi]);
  });

  it('should require every word of the query to match', () => {
    expect(searchAppointments([asha, ravi], 'asha 2077')).toEqual([]);
    expect(searchAppointments([asha, ravi], 'ravi 2077')).toEqual([ravi]);
  });
});
