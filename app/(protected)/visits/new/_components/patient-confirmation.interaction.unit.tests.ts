// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';

import { PatientConfirmation } from './patient-confirmation';

vi.mock('@/app/(protected)/patients/_components/patient-form', () => ({
  PatientForm: () => createElement('div', null, 'Patient registration form'),
}));
vi.mock('@/app/queries/patients/useUpdatePatient', () => ({
  useUpdatePatient: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

const patient = {
  id: 42,
  mrn: 'MRN-1042',
  firstName: 'Meera',
  middleName: null,
  lastName: 'Nair',
  gender: 'female',
  dateOfBirth: '1988-11-23',
  phone: '+91 98450 12345',
  addressLine1: '12 Lake Road',
  city: 'Kochi',
  state: null,
  country: null,
  emiratesId: null,
  passportNumber: 'P1234567',
  emergencyContactName: 'Ravi Nair',
  emergencyContactRelationship: 'Spouse',
  photoUrl: null,
  identityDocuments: [],
  isVip: false,
  isActive: true,
  registrationStatus: 'registered',
} as unknown as Patient;

const appointment = {
  bookingNumber: 'APT-7',
  slotDate: '2026-11-13',
  slots: [{ status: 'Booked', slotTime: '10:30' }],
  doctor: { id: 2, name: 'Dr. Kavya Menon' },
  appointmentType: { id: 1, name: 'Consultation' },
} as unknown as Appointment;

function renderConfirmation(props: Partial<Parameters<typeof PatientConfirmation>[0]> = {}) {
  const handlers = { onConfirm: vi.fn(), onChange: vi.fn(), onRetry: vi.fn() };
  render(
    createElement(PatientConfirmation, {
      patient,
      appointment,
      loading: false,
      error: null,
      confirmed: false,
      confirming: false,
      ...handlers,
      ...props,
    })
  );
  return handlers;
}

afterEach(cleanup);

describe('Patient confirmation', () => {
  it('should show the registration details to check with the Patient', () => {
    renderConfirmation();

    expect(screen.getByRole('heading', { name: 'Meera Nair' })).toBeTruthy();
    expect(screen.getByText('MRN-1042')).toBeTruthy();
    expect(screen.getByText('APT-7')).toBeTruthy();
    expect(screen.getByText('12 Lake Road, Kochi')).toBeTruthy();
    expect(screen.getByText('Ravi Nair · Spouse')).toBeTruthy();
    expect(screen.getByText('Passport P1234567')).toBeTruthy();
    expect(screen.queryByText('Patient registration form')).toBeNull();
  });

  it('should confirm the Patient from the details card', async () => {
    const { onConfirm } = renderConfirmation();

    await userEvent.click(screen.getByRole('button', { name: /Details are correct/ }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('should open the registration form on request', async () => {
    renderConfirmation();

    await userEvent.click(screen.getByRole('button', { name: 'Edit registration' }));
    expect(screen.getByText('Patient registration form')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Details are correct/ })).toBeNull();
  });

  it('should require a Provisional Patient to complete registration first', () => {
    renderConfirmation({ patient: { ...patient, registrationStatus: 'provisional' } as Patient });

    expect(screen.getByText('Provisional')).toBeTruthy();
    expect(screen.getByText('Patient registration form')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Details are correct/ })).toBeNull();
  });

  it('should collapse to a confirmed summary that can be changed', async () => {
    const { onChange } = renderConfirmation({ confirmed: true });

    expect(screen.getByText('Confirmed')).toBeTruthy();
    expect(screen.queryByText('Ravi Nair · Spouse')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Change Patient' }));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('should invite a search when no Patient is selected', () => {
    renderConfirmation({ patient: null, appointment: null });

    expect(screen.getByText('No Patient selected')).toBeTruthy();
  });
});
