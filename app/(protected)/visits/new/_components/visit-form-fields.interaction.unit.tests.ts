// @vitest-environment jsdom

import { createElement, Fragment } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, useWatch } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';
import { usePatientsQuery } from '@/app/queries/patients/usePatients';

import type { CreateVisitFormValues } from '../_utils/create-visit-form-schema';
import { VisitDetailsFields, VisitSourceFields } from './visit-form-fields';

vi.mock('@tanstack/react-pacer', () => ({ useDebouncedValue: (value: string) => [value] }));
vi.mock('@/app/queries/patients/usePatients', () => ({
  usePatientsQuery: vi.fn(() => ({
    data: {
      data: [
        {
          id: 42,
          firstName: 'Meera',
          lastName: 'Nair',
          mrn: 'MRN-1042',
          dateOfBirth: '1988-11-23',
          phone: '9000000001',
        },
      ],
      meta: { total: 1 },
    },
    isFetching: false,
    isError: false,
  })),
}));

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
  remarks: null,
};

const visitTypes = [
  { id: 3, code: 'OPD', name: 'Consultation' },
  { id: 4, code: 'PROC', name: 'Procedure' },
  { id: 5, code: 'FUP', name: 'Follow-up' },
] as VisitType[];

function Form({ showDetails = true }: { showDetails?: boolean }) {
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
  const patientId = useWatch({ control: form.control, name: 'patientId' });
  const visitTypeId = useWatch({ control: form.control, name: 'visitTypeId' });
  const purpose = useWatch({ control: form.control, name: 'chiefComplaint' });
  const remarks = useWatch({ control: form.control, name: 'remarks' });
  const props = {
    control: form.control,
    errors: form.formState.errors,
    setValue: form.setValue,
    resetField: form.resetField,
    appointments: [treatmentAppointment, consultationAppointment],
    selectedPatient: null,
    doctors: [],
    visitTypes,
    loading: false,
  };

  return createElement(
    Fragment,
    null,
    createElement(VisitSourceFields, props),
    showDetails ? createElement(VisitDetailsFields, props) : null,
    createElement('output', { 'data-testid': 'selected-patient-id' }, patientId),
    createElement('output', { 'data-testid': 'visit-type-id' }, visitTypeId),
    createElement('output', { 'data-testid': 'purpose' }, purpose),
    createElement('output', { 'data-testid': 'remarks' }, remarks)
  );
}

afterEach(cleanup);

describe('Create Visit Appointment defaults', () => {
  it('should retain Appointment defaults while Visit detail fields are unmounted', async () => {
    const user = userEvent.setup();
    render(createElement(Form, { showDetails: false }));

    await user.selectOptions(screen.getByLabelText(/^Appointment/), '1');
    expect(screen.getByTestId('visit-type-id').textContent).toBe('4');
    expect(screen.getByTestId('purpose').textContent).toBe('Shirodhara · Session 2');
    expect(screen.getByTestId('remarks').textContent).toBe('Continue treatment');
  });

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
    expect((screen.getByLabelText(/^Visit type/) as HTMLSelectElement).value).toBe('3');
    expect((screen.getByLabelText('Purpose of Visit') as HTMLTextAreaElement).value).toBe('');
    expect((screen.getByLabelText('Remarks') as HTMLTextAreaElement).value).toBe('');
  });
});

describe('Create Visit Walk-in Patient search', () => {
  it('should search by date of birth and select the matching Patient', async () => {
    const user = userEvent.setup();
    render(createElement(Form));

    await user.click(screen.getByRole('tab', { name: 'Walk-in' }));
    expect(screen.queryByRole('combobox', { name: /^Patient/ })).toBeNull();

    await user.type(screen.getByRole('searchbox', { name: /^Patient/ }), '23/11/1988');
    expect(vi.mocked(usePatientsQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ query: '23/11/1988', isActive: true }),
      expect.objectContaining({ enabled: true })
    );
    await user.click(screen.getByRole('button', { name: /Meera Nair.*MRN-1042.*DOB 1988-11-23/ }));
    expect(screen.getByTestId('selected-patient-id').textContent).toBe('42');
  });
});
