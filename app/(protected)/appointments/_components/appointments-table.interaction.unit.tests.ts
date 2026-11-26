// @vitest-environment jsdom

import { createElement, type ComponentProps } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import { AppointmentsTable } from './appointments-table';

afterEach(cleanup);

const appointment: Appointment = {
  id: 42,
  tenantId: 'tenant-test',
  cancelledAt: null,
  remarks: null,
  rescheduleReason: null,
  rotaName: null,
  doctorRotaId: null,
  bookingNumber: 'APT-1042',
  bookingPath: 'CONSULTATION',
  slotDate: '2026-10-19',
  startTime: '10:00',
  endTime: '10:30',
  createdOn: new Date('2026-10-19T09:00:00Z'),
  slots: [],
  patient: {
    id: 7,
    firstName: 'Meera',
    lastName: 'Nair',
    mrn: 'MRN-1007',
    phone: '9000000001',
    registrationStatus: 'registered',
  },
  doctor: { id: 11, name: 'Dr Kumar' },
  therapist: null,
  appointmentType: { id: 2, code: 'OPD', name: 'Consultation' },
  appointmentMode: { id: 3, code: 'IN_PERSON', name: 'In person' },
  appointmentReason: null,
  appointmentCancelledReason: null,
  appointmentStatus: { id: 1, code: 'SCH', category: 'scheduled', name: 'Scheduled' },
  treatment: null,
  treatmentSession: null,
};

async function openActions(overrides: Partial<ComponentProps<typeof AppointmentsTable>> = {}) {
  const user = userEvent.setup();

  render(
    createElement(AppointmentsTable, {
      appointments: [appointment],
      total: 1,
      totalPages: 1,
      page: 1,
      pageSize: 5,
      isFetching: false,
      onPageChange: () => {},
      onCancel: () => {},
      canReschedule: true,
      ...overrides,
    })
  );

  await user.click(screen.getByRole('button', { name: 'Actions for APT-1042' }));
}

describe('Appointment list Create Visit action', () => {
  it('should link to Create Visit with the selected Appointment ID', async () => {
    await openActions();

    expect(screen.getByRole('menuitem', { name: 'Create Visit' }).getAttribute('href')).toBe(
      '/visits/new?appointmentId=42'
    );
  });
});

describe('Appointment list permission-gated actions', () => {
  it('should offer Reschedule and Cancel Appointment to a user holding both permissions', async () => {
    await openActions();

    expect(screen.getByRole('menuitem', { name: 'Reschedule' }).getAttribute('href')).toBe(
      '/appointments/42/reschedule'
    );
    expect(screen.getByRole('menuitem', { name: 'Cancel Appointment' })).toBeTruthy();
  });

  it('should hide Reschedule without appointment:reschedule', async () => {
    await openActions({ canReschedule: false });

    expect(screen.queryByRole('menuitem', { name: 'Reschedule' })).toBeNull();
  });

  it('should hide Cancel Appointment without appointment:cancel', async () => {
    await openActions({ onCancel: undefined });

    expect(screen.queryByRole('menuitem', { name: 'Cancel Appointment' })).toBeNull();
  });
});
