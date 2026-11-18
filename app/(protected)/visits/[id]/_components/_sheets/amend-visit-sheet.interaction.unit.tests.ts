// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { ApiError } from '@/app/queries/api-error';
import { useAmendVisit } from '@/app/queries/visits/useAmendVisit';
import { AmendVisitSheet } from './amend-visit-sheet';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast }));
vi.mock('@/app/queries/visits/useAmendVisit', () => ({ useAmendVisit: vi.fn() }));
vi.mock('@/app/queries/doctors/useDoctors', () => ({
  useDoctorsQuery: () => ({
    data: { data: [{ id: 4, name: 'Dr. Meera Iyer' }] },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@/app/queries/visit-masters/visit-types/useVisitTypes', () => ({
  useVisitTypesQuery: () => ({
    data: {
      data: [
        { id: 2, name: 'OPD Consultation' },
        { id: 5, name: 'Follow-up' },
      ],
    },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@/app/queries/visit-masters/admit-sources/useAdmitSources', () => ({
  useAdmitSourcesQuery: () => ({
    data: { data: [{ id: 7, name: 'Referral' }] },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@/app/queries/treatments/useTreatments', () => ({
  useTreatmentsQuery: () => ({
    data: {
      data: [{ id: 11, name: 'Abhyanga', code: 'ABH', sessions: [{ id: 41, label: 'Day 1' }] }],
    },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@/components/clinical/rich-text-editor', async () => {
  const { createElement } = await import('react');
  return {
    RichTextEditor: ({
      id,
      value,
      onChange,
      'aria-label': label,
    }: {
      id: string;
      value: string;
      onChange: (value: string) => void;
      'aria-label': string;
    }) =>
      createElement('textarea', {
        id,
        value,
        'aria-label': label,
        onChange: (event: { target: { value: string } }) => onChange(event.target.value),
      }),
  };
});

const mutateAsync = vi.fn();
const visit = {
  id: 5120,
  visitNumber: 'VST-5120',
  status: 'COMPLETED',
  doctor: { id: 3, name: 'Dr. Arjun Rao' },
  visitType: { id: 2, name: 'OPD Consultation', code: 'OPD' },
  admitSource: null,
  treatment: null,
  treatmentSession: null,
  chiefComplaint: 'Knee pain',
  remarks: null,
} as unknown as Visit;

function renderSheet(onClose = vi.fn()) {
  render(createElement(AmendVisitSheet, { open: true, visit, onClose }));
  return onClose;
}

beforeEach(() => {
  vi.clearAllMocks();
  mutateAsync.mockResolvedValue({ data: visit });
  vi.mocked(useAmendVisit).mockReturnValue({ mutateAsync, isPending: false } as never);
});

afterEach(cleanup);

describe('Amend Visit sheet', () => {
  it('should open on the Visit as recorded, keeping an inactive Doctor selectable', () => {
    renderSheet();

    expect((screen.getByLabelText(/Doctor/) as HTMLSelectElement).value).toBe('3');
    expect(screen.getByRole('option', { name: 'Dr. Arjun Rao' })).toBeTruthy();
    expect((screen.getByLabelText(/Visit Type/) as HTMLSelectElement).value).toBe('2');
    expect((screen.getByLabelText('Purpose of Visit') as HTMLTextAreaElement).value).toBe(
      'Knee pain'
    );
  });

  it('should send the whole amended Visit and close', async () => {
    const user = userEvent.setup();
    const onClose = renderSheet();

    await user.selectOptions(screen.getByLabelText(/Doctor/), '4');
    await user.selectOptions(screen.getByLabelText(/Visit Type/), '5');
    await user.selectOptions(screen.getByLabelText('Admit Source'), '7');
    await user.selectOptions(screen.getByLabelText('Treatment'), '11');
    await user.selectOptions(screen.getByLabelText('Session'), '41');
    await user.type(screen.getByLabelText('Remarks'), 'Corrected after audit');
    await user.click(screen.getByRole('button', { name: 'Save amendment' }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 5120,
        request: {
          doctorId: 4,
          visitTypeId: 5,
          admitSourceId: 7,
          treatmentId: 11,
          treatmentSessionId: 41,
          chiefComplaint: 'Knee pain',
          remarks: 'Corrected after audit',
        },
      })
    );
    expect(toast.success).toHaveBeenCalledWith('VST-5120 amended.');
    expect(onClose).toHaveBeenCalled();
  });

  it('should require a Session when a Treatment is chosen', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.selectOptions(screen.getByLabelText('Treatment'), '11');
    await user.click(screen.getByRole('button', { name: 'Save amendment' }));

    expect(await screen.findByText('Choose the Session for this Treatment.')).toBeTruthy();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('should show the exact API error and stay open', async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(
      new ApiError('Visit VST-5120 is not completed and cannot be amended.', undefined, 409)
    );
    const onClose = renderSheet();

    await user.click(screen.getByRole('button', { name: 'Save amendment' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Visit VST-5120 is not completed and cannot be amended.'
      )
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
