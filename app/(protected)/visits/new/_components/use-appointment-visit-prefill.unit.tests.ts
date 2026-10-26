// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, useWatch } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';
import type { CreateVisitFormValues } from '../_utils/create-visit-form-schema';
import { useAppointmentVisitPrefill } from './use-appointment-visit-prefill';

const appointment = {
  id: 42,
  bookingPath: 'PROCEDURE',
  treatment: { name: 'Shirodhara' },
  treatmentSession: { label: 'Session 2' },
  remarks: 'Continue treatment',
} as Appointment;
const visitTypes = [{ id: 4, code: 'PROC', name: 'Procedure' }] as VisitType[];

function Harness({
  appointment: loadedAppointment,
  selectedAppointmentId = '42',
}: {
  appointment?: Appointment;
  selectedAppointmentId?: string;
}) {
  const form = useForm<CreateVisitFormValues>({
    defaultValues: {
      mode: 'appointment',
      appointmentId: '42',
      visitTypeId: '',
      chiefComplaint: '',
      remarks: '',
    },
  });
  const visitTypeId = useWatch({ control: form.control, name: 'visitTypeId' });
  const purpose = useWatch({ control: form.control, name: 'chiefComplaint' });
  const remarks = useWatch({ control: form.control, name: 'remarks' });
  const dirtyVisitType = form.getFieldState('visitTypeId').isDirty;

  useAppointmentVisitPrefill({
    form,
    selectedAppointmentId,
    initialAppointmentId: 42,
    initialAppointment: loadedAppointment,
    visitTypes,
  });

  return createElement(
    'div',
    null,
    createElement('output', { 'data-testid': 'visit-type' }, visitTypeId),
    createElement('output', { 'data-testid': 'purpose' }, purpose),
    createElement('output', { 'data-testid': 'remarks' }, remarks),
    createElement('output', { 'data-testid': 'visit-type-dirty' }, String(dirtyVisitType)),
    createElement('input', { 'aria-label': 'Purpose', ...form.register('chiefComplaint') })
  );
}

afterEach(cleanup);

describe('Appointment Visit prefill', () => {
  it('should fill Visit details when the linked Appointment loads and preserve staff edits', async () => {
    const user = userEvent.setup();
    const view = render(createElement(Harness));

    view.rerender(createElement(Harness, { appointment }));
    await waitFor(() => {
      expect(screen.getByTestId('visit-type').textContent).toBe('4');
      expect(screen.getByTestId('purpose').textContent).toBe('Shirodhara · Session 2');
      expect(screen.getByTestId('remarks').textContent).toBe('Continue treatment');
      expect(screen.getByTestId('visit-type-dirty').textContent).toBe('false');
    });

    await user.clear(screen.getByRole('textbox', { name: 'Purpose' }));
    await user.type(screen.getByRole('textbox', { name: 'Purpose' }), 'New symptoms');
    view.rerender(createElement(Harness, { appointment: { ...appointment, remarks: 'Updated' } }));
    await waitFor(() => {
      expect(screen.getByTestId('purpose').textContent).toBe('New symptoms');
      expect(screen.getByTestId('remarks').textContent).toBe('Continue treatment');
    });
  });

  it('should not prefill after staff selects a different Appointment', () => {
    render(createElement(Harness, { appointment, selectedAppointmentId: '99' }));

    expect(screen.getByTestId('visit-type').textContent).toBe('');
    expect(screen.getByTestId('purpose').textContent).toBe('');
  });
});
