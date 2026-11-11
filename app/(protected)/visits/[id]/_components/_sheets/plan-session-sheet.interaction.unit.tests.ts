// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  PatientTreatmentPlan,
  PatientTreatmentPlanReadSession,
} from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { ApiError } from '@/app/queries/api-error';
import { useStartPatientTreatmentPlanSession } from '@/app/queries/patient-treatment-plans/useStartPatientTreatmentPlanSession';
import { useUpdatePatientTreatmentPlanSession } from '@/app/queries/patient-treatment-plans/useUpdatePatientTreatmentPlanSession';
import { PlanSessionSheet } from './plan-session-sheet';

vi.mock('@/app/queries/patient-treatment-plans/useStartPatientTreatmentPlanSession', () => ({
  useStartPatientTreatmentPlanSession: vi.fn(),
}));
vi.mock('@/app/queries/patient-treatment-plans/useUpdatePatientTreatmentPlanSession', () => ({
  useUpdatePatientTreatmentPlanSession: vi.fn(),
}));

const startMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();
const visit = {
  id: 5120,
  status: 'IN_CONSULTATION',
  appointment: null,
  patient: { id: 42 },
} as unknown as Visit;
const session = {
  id: 902,
  sessionNumber: 2,
  label: 'Abhyanga Session',
  procedure: 'Abhyanga with Ksheerabala taila',
  durationMinutes: 50,
  setupMinutes: 10,
  cleaningMinutes: 5,
  preparation: 'Warm the oil.',
  warning: 'Avoid pressure over the left knee.',
  equipment: 'Droni',
  roomType: 'Panchakarma room',
  therapistSkill: 'Abhyanga',
  completionStatus: 'PENDING',
  completedVisitId: null,
  startedVisitId: null,
  startedAt: null,
  reservedAppointment: null,
} as unknown as PatientTreatmentPlanReadSession;

function plan(sessionOverrides: Partial<PatientTreatmentPlanReadSession> = {}) {
  return {
    id: 81,
    patientId: 42,
    status: 'IN_PROGRESS',
    treatmentName: 'Abhyanga',
    totalSessions: 6,
    sessions: [{ ...session, ...sessionOverrides }],
  } as unknown as PatientTreatmentPlan;
}

function renderSheet(
  props: Partial<Parameters<typeof PlanSessionSheet>[0]> = {},
  sessionOverrides: Partial<PatientTreatmentPlanReadSession> = {}
) {
  const current = plan(sessionOverrides);
  return render(
    createElement(PlanSessionSheet, {
      open: true,
      visit,
      plan: current,
      session: current.sessions[0],
      canUpdate: true,
      canStart: true,
      onClose: vi.fn(),
      ...props,
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  startMutateAsync.mockResolvedValue({ data: plan({ startedVisitId: 5120 }) });
  updateMutateAsync.mockResolvedValue({ data: plan() });
  vi.mocked(useStartPatientTreatmentPlanSession).mockReturnValue({
    mutateAsync: startMutateAsync,
    isPending: false,
  } as never);
  vi.mocked(useUpdatePatientTreatmentPlanSession).mockReturnValue({
    mutateAsync: updateMutateAsync,
    isPending: false,
  } as never);
});

afterEach(cleanup);

describe('Plan Session sheet', () => {
  it('should show the Session plan with its warning visible', () => {
    renderSheet();

    expect(screen.getByText('Session 2 of 6')).toBeTruthy();
    expect(screen.getByText('Abhyanga with Ksheerabala taila')).toBeTruthy();
    expect(screen.getByText('50 min')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Avoid pressure over the left knee.');
  });

  it('should start the Session in this Visit', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole('button', { name: 'Start Session' }));

    await waitFor(() => {
      expect(startMutateAsync).toHaveBeenCalledWith({
        patientId: 42,
        planId: 81,
        sessionId: 902,
        request: { visitId: 5120 },
      });
    });
  });

  it('should not offer Start without permission, for an inactive Visit, or once started', () => {
    renderSheet({ canStart: false });
    expect(screen.queryByRole('button', { name: 'Start Session' })).toBeNull();
    cleanup();

    renderSheet({ visit: { ...visit, status: 'COMPLETED' } as Visit });
    expect(screen.queryByRole('button', { name: 'Start Session' })).toBeNull();
    cleanup();

    renderSheet({}, { startedVisitId: 5120, startedAt: new Date('2026-11-10T04:30:00Z') });
    expect(screen.queryByRole('button', { name: 'Start Session' })).toBeNull();
    expect(screen.getByText('In progress in this Visit')).toBeTruthy();
  });

  it('should save an edited Session plan', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole('button', { name: 'Edit plan' }));
    await user.clear(screen.getByLabelText('Duration (minutes)'));
    await user.type(screen.getByLabelText('Duration (minutes)'), '40');
    await user.clear(screen.getByLabelText('Warning'));
    await user.click(screen.getByRole('button', { name: 'Save plan' }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith({
        patientId: 42,
        planId: 81,
        sessionId: 902,
        request: expect.objectContaining({ durationMinutes: 40, warning: '' }),
      });
    });
    expect(await screen.findByRole('button', { name: 'Edit plan' })).toBeTruthy();
  });

  it('should block an empty Procedure and show the exact server error', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole('button', { name: 'Edit plan' }));
    await user.clear(screen.getByLabelText('Procedure'));
    await user.click(screen.getByRole('button', { name: 'Save plan' }));
    expect(await screen.findByText('Procedure cannot be empty.')).toBeTruthy();
    expect(updateMutateAsync).not.toHaveBeenCalled();

    updateMutateAsync.mockRejectedValue(
      new ApiError('Conflict', ['Session 2 is already completed.'], 409)
    );
    await user.type(screen.getByLabelText('Procedure'), 'Abhyanga');
    await user.click(screen.getByRole('button', { name: 'Save plan' }));

    expect(await screen.findByText('Session 2 is already completed.')).toBeTruthy();
  });

  it('should not offer editing without permission', () => {
    renderSheet({ canUpdate: false });

    expect(screen.queryByRole('button', { name: 'Edit plan' })).toBeNull();
  });
});
