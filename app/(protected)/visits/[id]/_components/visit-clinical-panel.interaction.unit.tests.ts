// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PatientChart } from '@/app/api/lib/modules/patient-chart/schemas/patient-chart-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

import { VisitClinicalPanel } from './visit-clinical-panel';

vi.mock('@/app/queries/clinical-masters/allergens/useAllergens', () => ({
  useAllergensQuery: vi.fn(() => ({ isLoading: false, isError: false, data: { data: [] } })),
}));
vi.mock('@/app/queries/clinical-masters/note-types/useClinicalNoteTypes', () => ({
  useClinicalNoteTypesQuery: vi.fn(() => ({
    isLoading: false,
    isError: false,
    data: { data: [] },
  })),
}));

afterEach(cleanup);

describe('Visit Clinical panel record actions', () => {
  it('shows the diagnoses recorded on a Visit Clinical Note', () => {
    render(
      createElement(VisitClinicalPanel, {
        visit: { id: 7, status: 'IN_CONSULTATION', patient: { id: 3 } } as Visit,
        chart: {
          vitalSigns: [],
          clinicalNotes: [
            {
              id: 1,
              visitId: 7,
              noteTypeId: 3,
              status: 'draft',
              assessment: 'Diagnosis Code: M54 — Dorsalgia (back pain)',
            },
          ],
          allergies: [],
          medications: [],
        } as unknown as PatientChart,
        chartLoading: false,
        chartError: false,
        canRecordVitals: true,
        canCreateNote: true,
        onRecordVitals: vi.fn(),
        onAddClinicalNote: vi.fn(),
        onNursingHandoff: vi.fn(),
        onAddAllergy: vi.fn(),
        onAddMedication: vi.fn(),
      })
    );

    expect(screen.getByText(/Diagnosis Code: M54/)).toBeTruthy();
  });

  it('opens separate Allergy and Medication capture actions without opening a Clinical Note', () => {
    const onAddAllergy = vi.fn();
    const onAddMedication = vi.fn();
    const onAddClinicalNote = vi.fn();
    const onNursingHandoff = vi.fn();

    render(
      createElement(VisitClinicalPanel, {
        visit: { id: 7, status: 'CHECKED_IN', patient: { id: 3 } } as Visit,
        chart: {
          vitalSigns: [],
          clinicalNotes: [],
          allergies: [],
          medications: [],
        } as unknown as PatientChart,
        chartLoading: false,
        chartError: false,
        canRecordVitals: true,
        canCreateNote: true,
        onRecordVitals: vi.fn(),
        onAddClinicalNote,
        onNursingHandoff,
        onAddAllergy,
        onAddMedication,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add allergy' }));
    expect(onAddAllergy).toHaveBeenCalledOnce();
    expect(onAddClinicalNote).not.toHaveBeenCalled();
    expect(onNursingHandoff).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Add medication' }));
    expect(onAddMedication).toHaveBeenCalledOnce();
    expect(onAddClinicalNote).not.toHaveBeenCalled();
    expect(onNursingHandoff).not.toHaveBeenCalled();
  });
});
