// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';

import { PatientTreatmentsCard } from './patient-treatments-card';

const currentPlan = {
  id: 2,
  status: 'IN_PROGRESS',
  treatmentName: 'Panchakarma',
  treatmentCode: 'PK-01',
  totalSessions: 6,
  completedSessions: 2,
  sessions: [
    {
      id: 3,
      sessionNumber: 3,
      label: 'Abhyanga',
      startedVisitId: null,
      completionStatus: 'PENDING',
      reservedAppointment: { bookingNumber: 'APT-1001' },
    },
  ],
} as PatientTreatmentPlan;

const pastPlan = {
  id: 1,
  status: 'COMPLETED',
  treatmentName: 'Shirodhara',
  treatmentCode: 'SD-01',
  totalSessions: 3,
  completedSessions: 3,
  sessions: [],
} as unknown as PatientTreatmentPlan;

function renderCard(props: Partial<Parameters<typeof PatientTreatmentsCard>[0]> = {}) {
  return render(
    createElement(PatientTreatmentsCard, {
      plans: [pastPlan, currentPlan],
      loading: false,
      error: false,
      onRetry: vi.fn(),
      linkedBookingNumber: null,
      ...props,
    })
  );
}

afterEach(cleanup);

describe('Patient Treatments card', () => {
  it('should list current Plans before treatment history with progress and status', () => {
    renderCard();

    const names = screen
      .getAllByRole('listitem')
      .map((item) => item.querySelector('p')?.textContent);
    expect(names).toEqual(['Panchakarma', 'Shirodhara']);
    expect(screen.getByText('1 current · 1 in history')).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('2 of 6 Sessions completed')).toBeTruthy();
    expect(screen.getByText('3 of 3 Sessions completed')).toBeTruthy();
  });

  it('should show the next Session and its booking for a current Plan', () => {
    renderCard();

    expect(screen.getByText('Next: Session 3 · Abhyanga')).toBeTruthy();
    expect(screen.getByText('Booked · APT-1001')).toBeTruthy();
    expect(screen.queryByText('This Visit')).toBeNull();
  });

  it('should mark the Session the Appointment being checked in fulfils', () => {
    renderCard({ linkedBookingNumber: 'APT-1001' });

    expect(screen.getByText('This Visit')).toBeTruthy();
  });

  it('should show an empty state when the Patient has no Treatment Plans', () => {
    renderCard({ plans: [] });

    expect(screen.getByText('No Treatment Plans have been assigned to this Patient.')).toBeTruthy();
  });

  it('should show a loading state', () => {
    renderCard({ loading: true });

    expect(screen.getByLabelText('Loading Treatment Plans')).toBeTruthy();
    expect(screen.queryByText('Panchakarma')).toBeNull();
  });

  it('should let the user retry when Treatment Plans fail to load', async () => {
    const onRetry = vi.fn();
    renderCard({ error: true, onRetry });

    expect(screen.getByText('Treatment Plans could not be loaded.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
