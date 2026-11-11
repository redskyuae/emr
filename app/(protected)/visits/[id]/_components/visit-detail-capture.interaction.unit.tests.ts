// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VisitDetailImpl } from './visit-detail-impl';

vi.mock('nuqs', async () => {
  const { useState } = await import('react');
  return {
    parseAsInteger: {},
    useQueryState: () => useState<string | number | null>(null),
  };
});
vi.mock('@/app/queries/patient-treatment-plans/usePatientTreatmentPlans', () => ({
  usePatientTreatmentPlanHistoryQuery: () => ({
    data: [{ id: 81, sessions: [{ id: 902, sessionNumber: 2 }] }],
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@/app/queries/visits/useVisit', () => ({
  useVisit: () => ({
    data: {
      id: 7,
      visitNumber: 'VST-1007',
      visitDate: '2026-10-28',
      status: 'CHECKED_IN',
      queueToken: 3,
      patient: { id: 3, firstName: 'Asha', lastName: 'Rao', mrn: 'MRN-3' },
      doctor: { name: 'Dr. Iyer' },
      visitType: { name: 'OPD Consultation' },
      appointment: null,
      treatmentSession: null,
    },
  }),
}));
vi.mock('@/app/queries/patients/chart/usePatientChart', () => ({
  usePatientChartQuery: () => ({
    data: { allergies: [], medications: [] },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@/app/queries/clinical-masters/allergens/useAllergens', () => ({
  useAllergensQuery: () => ({ data: { data: [] }, isLoading: false, isError: false }),
}));
vi.mock('@/app/queries/identity-access/useCurrentUser', () => ({
  useHasPermission: () => ({ data: false }),
}));
vi.mock('@/app/queries/visits/useStartConsultation', () => ({
  useStartConsultation: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));
vi.mock('@/app/queries/billing/invoices/useInvoices', () => ({
  useInvoicesQuery: () => ({ data: { data: [] }, isLoading: false, isError: false }),
}));
vi.mock('@/app/(protected)/patients/[id]/_components/_chart/allergy-banner', () => ({
  AllergyBanner: () => null,
}));
vi.mock(
  '@/app/(protected)/patients/[id]/_components/_chart/_sheets/allergy-form-sheet',
  async () => {
    const { createElement } = await import('react');
    return {
      AllergyFormSheet: ({ open }: { open: boolean }) =>
        open ? createElement('div', { 'data-testid': 'allergy-sheet' }) : null,
    };
  }
);
vi.mock(
  '@/app/(protected)/patients/[id]/_components/_chart/_sheets/medication-form-sheet',
  async () => {
    const { createElement } = await import('react');
    return {
      MedicationFormSheet: ({ open }: { open: boolean }) =>
        open ? createElement('div', { 'data-testid': 'medication-sheet' }) : null,
    };
  }
);
vi.mock('./_sheets/add-note-sheet', async () => {
  const { createElement } = await import('react');
  return {
    AddNoteSheet: ({ open }: { open: boolean }) =>
      open ? createElement('div', { 'data-testid': 'note-sheet' }) : null,
  };
});
vi.mock('./_sheets/record-vitals-sheet', () => ({ RecordVitalsSheet: () => null }));
vi.mock('./_sheets/assign-treatment-plan-sheet', () => ({ AssignTreatmentPlanSheet: () => null }));
vi.mock('./_sheets/daily-treatment-sheet', () => ({ DailyTreatmentSheet: () => null }));
vi.mock('./_sheets/plan-session-sheet', async () => {
  const { createElement } = await import('react');
  return {
    PlanSessionSheet: ({ session }: { session: { sessionNumber: number } }) =>
      createElement('div', { 'data-testid': 'plan-session-sheet' }, session.sessionNumber),
  };
});
vi.mock('../../_components/_modals/cancel-visit-dialog', () => ({ CancelVisitDialog: () => null }));
vi.mock('./_modals/complete-visit-dialog', () => ({ CompleteVisitDialog: () => null }));
vi.mock('./_modals/sign-clinical-note-dialog', () => ({ SignClinicalNoteDialog: () => null }));
vi.mock('./visit-patient-header', () => ({ VisitPatientHeader: () => null }));
vi.mock('./visit-snapshot-rail', () => ({ VisitSnapshotRail: () => null }));
vi.mock('./visit-workflow-stepper', () => ({ VisitWorkflowStepper: () => null }));
vi.mock('./visit-care-pathway', async () => {
  const { createElement } = await import('react');
  return {
    VisitCarePathway: ({
      onAddAllergy,
      onAddMedication,
      onOpenPlanSession,
    }: {
      onAddAllergy: () => void;
      onAddMedication: () => void;
      onOpenPlanSession: (sessionId: number) => void;
    }) =>
      createElement(
        'div',
        null,
        createElement('button', { onClick: onAddAllergy }, 'Add allergy'),
        createElement('button', { onClick: onAddMedication }, 'Add medication'),
        createElement('button', { onClick: () => onOpenPlanSession(902) }, 'Open Session 2')
      ),
  };
});

afterEach(cleanup);

describe('Visit detail capture routing', () => {
  it('opens the Allergy form for an Allergy action', () => {
    render(createElement(VisitDetailImpl, { visitId: 7 }));

    fireEvent.click(screen.getByRole('button', { name: 'Add allergy' }));

    expect(screen.getByTestId('allergy-sheet')).toBeTruthy();
    expect(screen.queryByTestId('medication-sheet')).toBeNull();
    expect(screen.queryByTestId('note-sheet')).toBeNull();
  });

  it('opens the Medication form for a Medication action', () => {
    render(createElement(VisitDetailImpl, { visitId: 7 }));

    fireEvent.click(screen.getByRole('button', { name: 'Add medication' }));

    expect(screen.getByTestId('medication-sheet')).toBeTruthy();
    expect(screen.queryByTestId('allergy-sheet')).toBeNull();
    expect(screen.queryByTestId('note-sheet')).toBeNull();
  });

  it('should open the Session plan sheet for the selected Patient Treatment Plan Session', () => {
    render(createElement(VisitDetailImpl, { visitId: 7 }));

    expect(screen.queryByTestId('plan-session-sheet')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open Session 2' }));

    expect(screen.getByTestId('plan-session-sheet').textContent).toBe('2');
  });
});
