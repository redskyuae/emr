// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

import { VisitBillingPanel } from './visit-billing-panel';
import { VisitClinicalPanel } from './visit-clinical-panel';
import { VisitTreatmentPlansPanel } from './visit-treatment-plans-panel';

vi.mock('@/app/queries/clinical-masters/allergens/useAllergens', () => ({
  useAllergensQuery: vi.fn(() => ({ isLoading: true, isError: false, data: undefined })),
}));
vi.mock('@/app/queries/clinical-masters/note-types/useClinicalNoteTypes', () => ({
  useClinicalNoteTypesQuery: vi.fn(() => ({ isLoading: true, isError: false, data: undefined })),
}));

const visit = { id: 7, status: 'CHECKED_IN', patient: { id: 3 } } as Visit;

afterEach(cleanup);

describe('Visit panel loaders', () => {
  it('should show Treatment Plan placeholders before showing an empty state', () => {
    render(
      createElement(VisitTreatmentPlansPanel, {
        visit,
        plans: [],
        loading: true,
        error: false,
        canAssignPlan: false,
        canBookAppointment: false,
        onAssignPlan: () => {},
      })
    );

    expect(screen.getByLabelText('Loading Treatment Plans')).toBeTruthy();
    expect(screen.queryByText('No active Patient Treatment Plan')).toBeNull();
  });

  it('should show Invoice placeholders before showing an empty state', () => {
    render(
      createElement(VisitBillingPanel, {
        visit,
        invoices: [],
        loading: true,
        error: false,
        canCreateInvoice: false,
      })
    );

    expect(screen.getByLabelText('Loading Invoices')).toBeTruthy();
    expect(screen.queryByText('No Invoice yet')).toBeNull();
  });

  it('should show clinical placeholders while Chart and lookup Masters load', () => {
    render(
      createElement(VisitClinicalPanel, {
        visit,
        chart: undefined,
        chartLoading: true,
        chartError: false,
        canRecordVitals: false,
        canCreateNote: false,
        onRecordVitals: () => {},
        onAddClinicalNote: () => {},
        onNursingHandoff: () => {},
        onAddAllergy: () => {},
        onAddMedication: () => {},
      })
    );

    expect(screen.getByLabelText('Loading clinical records')).toBeTruthy();
    expect(screen.queryByText('No Vital Signs recorded yet.')).toBeNull();
  });
});
