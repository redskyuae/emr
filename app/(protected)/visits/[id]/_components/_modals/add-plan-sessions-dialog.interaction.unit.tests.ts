// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import { ApiError } from '@/app/queries/api-error';
import { useAddPatientTreatmentPlanSessions } from '@/app/queries/patient-treatment-plans/useAddPatientTreatmentPlanSessions';
import { AddPlanSessionsDialog } from './add-plan-sessions-dialog';

vi.mock('@/app/queries/patient-treatment-plans/useAddPatientTreatmentPlanSessions', () => ({
  useAddPatientTreatmentPlanSessions: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const addSessions = vi.mocked(useAddPatientTreatmentPlanSessions);
const mutateAsync = vi.fn();
const plan = {
  id: 81,
  treatmentName: 'Abhyanga',
  totalSessions: 6,
  completedSessions: 2,
} as unknown as PatientTreatmentPlan;

beforeEach(() => {
  vi.clearAllMocks();
  addSessions.mockReturnValue({ mutateAsync, isPending: false } as never);
});

afterEach(cleanup);

function renderDialog() {
  const onClose = vi.fn();
  render(createElement(AddPlanSessionsDialog, { patientId: 7, plan, onClose }));
  return onClose;
}

describe('Add Plan Sessions dialog', () => {
  it('should show the Plan it extends and its current progress', () => {
    renderDialog();

    expect(screen.getByText(/Extend Abhyanga\./)).toBeTruthy();
    expect(screen.getByText(/continue after Session 6/)).toBeTruthy();
    expect(screen.getByText('2 completed · 6 currently planned')).toBeTruthy();
  });

  it('should add the entered number of Sessions to this Plan', async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({ data: plan });
    renderDialog();

    const input = screen.getByLabelText(/^Sessions/);
    await user.clear(input);
    await user.type(input, '3');
    await user.click(screen.getByRole('button', { name: 'Add Sessions' }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        patientId: 7,
        request: { patientTreatmentPlanId: 81, sessions: 3 },
      })
    );
  });

  it('should not call the API when the count is invalid', async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByLabelText(/^Sessions/);
    await user.clear(input);
    await user.type(input, '0');
    await user.click(screen.getByRole('button', { name: 'Add Sessions' }));

    expect(await screen.findByText('Sessions must be a positive integer')).toBeTruthy();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('should show the exact API error and stay open', async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(
      new ApiError('Conflict', ['Patient Treatment Plan is no longer available.'], 409)
    );
    const onClose = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Add Sessions' }));

    expect(await screen.findByText('Patient Treatment Plan is no longer available.')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
