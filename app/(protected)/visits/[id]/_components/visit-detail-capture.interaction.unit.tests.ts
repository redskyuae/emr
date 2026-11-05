// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VisitDetailImpl } from './visit-detail-impl';

vi.mock('nuqs', async () => {
  const { useState } = await import('react');
  return { useQueryState: () => useState<string | null>(null) };
});
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
vi.mock('@/app/queries/visits/useCompleteVisit', () => ({
  useCompleteVisit: () => ({ isPending: false, mutateAsync: vi.fn() }),
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
vi.mock('./_sheets/doctor-consultation-sheet', () => ({ DoctorConsultationSheet: () => null }));
vi.mock('./_sheets/daily-treatment-sheet', () => ({ DailyTreatmentSheet: () => null }));
vi.mock('../../_components/_modals/cancel-visit-dialog', () => ({ CancelVisitDialog: () => null }));
vi.mock('./visit-status-timeline', () => ({ VisitStatusTimeline: () => null }));
vi.mock('./visit-care-pathway', async () => {
  const { createElement } = await import('react');
  return {
    VisitCarePathway: ({
      onAddAllergy,
      onAddMedication,
    }: {
      onAddAllergy: () => void;
      onAddMedication: () => void;
    }) =>
      createElement(
        'div',
        null,
        createElement('button', { onClick: onAddAllergy }, 'Add allergy'),
        createElement('button', { onClick: onAddMedication }, 'Add medication')
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
});
