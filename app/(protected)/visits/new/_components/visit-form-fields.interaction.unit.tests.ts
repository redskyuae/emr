// @vitest-environment jsdom

import { createElement, Fragment } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';

import type { CreateVisitFormValues } from '../_utils/create-visit-form-schema';
import { VisitDetailsFields, VisitSourceFields } from './visit-form-fields';

const treatmentAppointment = {
  id: 1,
  bookingNumber: 'APT-1',
  patient: { firstName: 'Asha', lastName: 'Rao' },
  doctor: null,
  bookingPath: 'PROCEDURE',
  treatment: { name: 'Shirodhara' },
  treatmentSession: { label: 'Session 2' },
  remarks: 'Continue treatment',
} as Appointment;

const consultationAppointment = {
  ...treatmentAppointment,
  id: 2,
  bookingNumber: 'APT-2',
  bookingPath: 'CONSULTATION' as const,
  treatment: null,
  treatmentSession: null,
};

const visitTypes = [
  { id: 3, code: 'OPD', name: 'Consultation' },
  { id: 4, code: 'PROC', name: 'Procedure' },
] as VisitType[];

function Form() {
  const form = useForm<CreateVisitFormValues>({
    defaultValues: {
      mode: 'appointment',
      appointmentId: '',
      patientId: '',
      doctorId: '',
      visitTypeId: '',
      chiefComplaint: '',
      remarks: '',
    },
  });
  const props = {
    control: form.control,
    errors: form.formState.errors,
    setValue: form.setValue,
    appointments: [treatmentAppointment, consultationAppointment],
    patients: [],
    doctors: [],
    visitTypes,
    loading: false,
  };

  return createElement(
    Fragment,
    null,
    createElement(VisitSourceFields, props),
    createElement(VisitDetailsFields, props)
  );
}

afterEach(cleanup);

describe('Create Visit Appointment defaults', () => {
  it('should fill Treatment details and clear them when the Appointment changes', async () => {
    const user = userEvent.setup();
    render(createElement(Form));

    await user.selectOptions(screen.getByLabelText(/^Appointment/), '1');
    expect((screen.getByLabelText(/^Visit type/) as HTMLSelectElement).value).toBe('4');
    expect((screen.getByLabelText('Purpose of Visit') as HTMLTextAreaElement).value).toBe(
      'Shirodhara · Session 2'
    );
    expect((screen.getByLabelText('Remarks') as HTMLTextAreaElement).value).toBe(
      'Continue treatment'
    );

    await user.clear(screen.getByLabelText('Purpose of Visit'));
    await user.type(screen.getByLabelText('Purpose of Visit'), 'Patient reports new symptoms');
    expect((screen.getByLabelText('Purpose of Visit') as HTMLTextAreaElement).value).toBe(
      'Patient reports new symptoms'
    );

    await user.selectOptions(screen.getByLabelText(/^Appointment/), '2');
    expect((screen.getByLabelText(/^Visit type/) as HTMLSelectElement).value).toBe('');
    expect((screen.getByLabelText('Purpose of Visit') as HTMLTextAreaElement).value).toBe('');
    expect((screen.getByLabelText('Remarks') as HTMLTextAreaElement).value).toBe('');
  });
});
