// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

import { VisitTreatmentPlanSummary } from './visit-treatment-plan-summary';

const visit = { id: 7, appointment: { bookingNumber: 'APT-1001' } } as Visit;

function plan(overrides: Partial<PatientTreatmentPlan> = {}) {
  return {
    id: 1,
    status: 'IN_PROGRESS',
    treatmentName: 'Panchakarma',
    totalSessions: 6,
    completedSessions: 2,
    sessions: [
      {
        id: 3,
        sessionNumber: 3,
        label: 'Abhyanga',
        isReserved: true,
        completedVisitId: null,
        startedVisitId: null,
        completionStatus: 'PENDING',
        reservedAppointment: { bookingNumber: 'APT-1001' },
      },
    ],
    ...overrides,
  } as PatientTreatmentPlan;
}

function renderSummary(props: Partial<Parameters<typeof VisitTreatmentPlanSummary>[0]> = {}) {
  return render(
    createElement(VisitTreatmentPlanSummary, {
      visit,
      plans: [plan()],
      loading: false,
      error: false,
      ...props,
    })
  );
}

afterEach(cleanup);

describe('Visit Treatment Plan summary', () => {
  it('should show the treatment name, Session and progress', () => {
    renderSummary();

    expect(screen.getByText('Panchakarma')).toBeTruthy();
    expect(screen.getByText('Session 3 of 6 · Abhyanga')).toBeTruthy();
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('2 of 6 completed')).toBeTruthy();
  });

  it('should label an unbooked Session as the next one', () => {
    renderSummary({
      plans: [
        plan({
          sessions: [
            {
              ...plan().sessions[0],
              label: null,
              isReserved: false,
              reservedAppointment: null,
            },
          ],
        }),
      ],
    });

    expect(screen.getByText('Session 3 of 6')).toBeTruthy();
    expect(screen.getByText('Next')).toBeTruthy();
  });

  it('should list every current plan', () => {
    renderSummary({ plans: [plan(), plan({ id: 2, treatmentName: 'Shirodhara' })] });

    expect(screen.getByText('Panchakarma')).toBeTruthy();
    expect(screen.getByText('Shirodhara')).toBeTruthy();
  });

  it('should show nothing when the Patient has no current plan', () => {
    const { container } = renderSummary({ plans: [plan({ status: 'COMPLETED' })] });

    expect(container.textContent).toBe('');
  });

  it('should show the loading and error states', () => {
    renderSummary({ loading: true });
    expect(screen.getByLabelText('Loading Patient Treatment Plans')).toBeTruthy();
    cleanup();

    renderSummary({ error: true });
    expect(screen.getByText('Treatment Plans could not be loaded.')).toBeTruthy();
  });
});
