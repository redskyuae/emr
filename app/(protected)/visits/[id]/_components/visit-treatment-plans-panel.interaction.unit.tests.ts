// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

import { VisitTreatmentPlansPanel } from './visit-treatment-plans-panel';

const visit = { id: 5120, status: 'IN_CONSULTATION', appointment: null } as unknown as Visit;

function session(id: number, sessionNumber: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    sessionNumber,
    procedure: 'Abhyanga',
    completionStatus: 'PENDING',
    completedVisitId: null,
    startedVisitId: null,
    isReserved: false,
    reservedAppointment: null,
    ...overrides,
  };
}

function plans(...sessions: ReturnType<typeof session>[]) {
  return [
    {
      id: 81,
      status: 'IN_PROGRESS',
      treatmentName: 'Abhyanga',
      totalSessions: sessions.length,
      completedSessions: 1,
      sessions,
    },
  ] as unknown as PatientTreatmentPlan[];
}

function renderPanel(props: Partial<Parameters<typeof VisitTreatmentPlansPanel>[0]> = {}) {
  const onOpenSession = vi.fn();
  render(
    createElement(VisitTreatmentPlansPanel, {
      visit,
      plans: plans(
        session(901, 1, { completionStatus: 'COMPLETED', completedVisitId: 4000 }),
        session(902, 2)
      ),
      loading: false,
      error: false,
      canAssignPlan: false,
      canBookAppointment: false,
      canStartSession: true,
      onAssignPlan: vi.fn(),
      onOpenSession,
      ...props,
    })
  );
  return onOpenSession;
}

afterEach(cleanup);

describe('Visit Treatment Plans panel', () => {
  it('should open a Session plan from its tile', async () => {
    const user = userEvent.setup();
    const onOpenSession = renderPanel();

    await user.click(screen.getByRole('button', { name: 'Session 1, Done. View Session plan' }));

    expect(onOpenSession).toHaveBeenCalledWith(901);
  });

  it('should offer to start the next Session and open its plan first', async () => {
    const user = userEvent.setup();
    const onOpenSession = renderPanel();

    await user.click(screen.getByRole('button', { name: 'Start Session 2' }));

    expect(onOpenSession).toHaveBeenCalledWith(902);
  });

  it('should show a started Session as in progress without offering Start again', () => {
    renderPanel({
      plans: plans(session(901, 1), session(902, 2, { startedVisitId: 5120 })),
    });

    expect(
      screen.getByRole('button', { name: 'Session 2, In progress. View Session plan' })
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Start Session/ })).toBeNull();
  });

  it('should not offer Start without permission', () => {
    renderPanel({ canStartSession: false });

    expect(screen.queryByRole('button', { name: /^Start Session/ })).toBeNull();
  });
});
