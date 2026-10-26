// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAssignPatientTreatmentPlan } from '@/app/queries/patient-treatment-plans/useAssignPatientTreatmentPlan';
import { useTreatmentsQuery } from '@/app/queries/treatments/useTreatments';
import { AssignTreatmentPlanSheet } from './assign-treatment-plan-sheet';

vi.mock('@/app/queries/patient-treatment-plans/useAssignPatientTreatmentPlan', () => ({
  useAssignPatientTreatmentPlan: vi.fn(),
}));
vi.mock('@/app/queries/treatments/useTreatments', () => ({ useTreatmentsQuery: vi.fn() }));

const assign = vi.mocked(useAssignPatientTreatmentPlan);
const treatments = vi.mocked(useTreatmentsQuery);
const mutateAsync = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mutateAsync.mockResolvedValue({ data: { id: 41 } });
  assign.mockReturnValue({ mutateAsync, isPending: false } as never);
  treatments.mockReturnValue({
    data: {
      data: [
        {
          id: 12,
          name: 'Abhyanga',
          code: 'ABH',
          sessionStructure: 'SEQUENCED',
          sessions: [
            { id: 1, procedure: 'Oil massage', durationMinutes: 45 },
            { id: 2, procedure: 'Steam therapy', durationMinutes: 30 },
          ],
        },
      ],
    },
    isFetching: false,
    isError: false,
  } as never);
});

afterEach(cleanup);

describe('Assign Patient Treatment Plan sheet', () => {
  it('should search in the Treatment dropdown and assign extra Sequenced Sessions together', async () => {
    const user = userEvent.setup();
    render(createElement(AssignTreatmentPlanSheet, { open: true, patientId: 7, onClose: vi.fn() }));

    expect(screen.queryByLabelText('Search Treatments')).toBeNull();
    const search = screen.getByPlaceholderText('Search Treatment name or code');
    await user.type(search, 'Abhyanga');
    await user.click(await screen.findByText('Abhyanga'));
    await user.clear(screen.getByLabelText('Additional Sessions'));
    await user.type(screen.getByLabelText('Additional Sessions'), '2');
    await user.click(screen.getByRole('button', { name: 'Assign Treatment Plan' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        patientId: 7,
        request: { treatmentId: 12, additionalSessions: 2 },
      });
    });
  });

  it('should assign the chosen Session count for a Repeatable Treatment', async () => {
    treatments.mockReturnValue({
      data: {
        data: [
          {
            id: 15,
            name: 'Shirodhara',
            code: 'SHI',
            sessionStructure: 'REPEATABLE',
            defaultTotalSessions: 3,
            sessions: [{ id: 3, procedure: 'Shirodhara', durationMinutes: 45 }],
          },
        ],
      },
      isFetching: false,
      isError: false,
    } as never);
    const user = userEvent.setup();
    render(createElement(AssignTreatmentPlanSheet, { open: true, patientId: 7, onClose: vi.fn() }));

    await user.type(screen.getByPlaceholderText('Search Treatment name or code'), 'Shirodhara');
    await user.click(await screen.findByText('Shirodhara'));
    expect((screen.getByLabelText(/Number of Sessions/) as HTMLInputElement).value).toBe('3');
    await user.click(screen.getByRole('button', { name: 'Assign Treatment Plan' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        patientId: 7,
        request: { treatmentId: 15, totalSessions: 3 },
      });
    });
  });
});
