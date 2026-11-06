// @vitest-environment jsdom

import { createElement, Fragment } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, useWatch } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AdmitSource } from '@/app/api/lib/modules/admit-source/schemas/admit-source-schema';
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

const admitSources = [
  { id: 7, code: 'DOCREF', name: 'Doctor Referral' },
  { id: 8, code: 'EMER', name: 'Emergency' },
] as AdmitSource[];

function Form({ showDetails = true }: { showDetails?: boolean }) {
  const form = useForm<CreateVisitFormValues>({
    defaultValues: {
      mode: 'appointment',
      appointmentId: '',
      patientId: '',
      doctorId: '',
      visitTypeId: '',
      admitSourceId: '',
      chiefComplaint: '',
      remarks: '',
    },
  });
  const patientId = useWatch({ control: form.control, name: 'patientId' });
  const visitTypeId = useWatch({ control: form.control, name: 'visitTypeId' });
  const admitSourceId = useWatch({ control: form.control, name: 'admitSourceId' });
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
    admitSources,
    loading: false,
  };

  return createElement(
    Fragment,
    null,
    createElement(VisitSourceFields, props),
    showDetails ? createElement(VisitDetailsFields, props) : null,
    createElement('output', { 'data-testid': 'selected-patient-id' }, patientId),
    createElement('output', { 'data-testid': 'visit-type-id' }, visitTypeId),
    createElement('output', { 'data-testid': 'admit-source-id' }, admitSourceId),
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
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Purpose of Visit' }).textContent).toBe(
        'Shirodhara · Session 2'
      )
    );
    expect(screen.getByRole('textbox', { name: 'Remarks' }).textContent).toBe('Continue treatment');

    await user.selectOptions(screen.getByLabelText(/^Appointment/), '2');
    expect((screen.getByLabelText(/^Visit type/) as HTMLSelectElement).value).toBe('3');
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Purpose of Visit' }).textContent).toBe('')
    );
    expect(screen.getByRole('textbox', { name: 'Remarks' }).textContent).toBe('');
  });
});

describe('Create Visit Admit source', () => {
  it('should offer the Admit Sources as an optional choice', () => {
    render(createElement(Form));

    const select = screen.getByLabelText('Admit source') as HTMLSelectElement;

    expect(select.getAttribute('aria-required')).toBeNull();
    expect(Array.from(select.options).map((option) => option.text)).toEqual([
      'Select an Admit source',
      'Doctor Referral',
      'Emergency',
    ]);
  });

  it('should store the selected Admit Source', async () => {
    const user = userEvent.setup();
    render(createElement(Form));

    await user.selectOptions(screen.getByLabelText('Admit source'), '8');

    expect(screen.getByTestId('admit-source-id').textContent).toBe('8');
  });

  it('should clear the Admit Source when the Appointment changes', async () => {
    const user = userEvent.setup();
    render(createElement(Form));

    await user.selectOptions(screen.getByLabelText(/^Appointment/), '1');
    await user.selectOptions(screen.getByLabelText('Admit source'), '7');
    await user.selectOptions(screen.getByLabelText(/^Appointment/), '2');

    expect(screen.getByTestId('admit-source-id').textContent).toBe('');
  });

  it('should clear the Admit Source when switching to a Walk-in Visit', async () => {
    const user = userEvent.setup();
    render(createElement(Form));

    await user.selectOptions(screen.getByLabelText('Admit source'), '7');
    await user.click(screen.getByRole('tab', { name: 'Walk-in' }));

    expect(screen.getByTestId('admit-source-id').textContent).toBe('');
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
