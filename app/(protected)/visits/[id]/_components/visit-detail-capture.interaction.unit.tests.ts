// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VisitDetailImpl } from './visit-detail-impl';

const state = vi.hoisted(() => ({
  status: 'CHECKED_IN',
  canAmend: false,
  initialParams: {} as Record<string, number | string>,
  paramWrites: [] as [string, unknown][],
}));

vi.mock('nuqs', async () => {
  const { useState } = await import('react');
  return {
    parseAsInteger: {},
    useQueryState: (key: string) => {
      const [value, setValue] = useState<string | number | null>(state.initialParams[key] ?? null);
      const write = (next: string | number | null) => {
        state.paramWrites.push([key, next]);
        setValue(next);
      };

      return [value, write];
    },
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
      status: state.status,
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
    data: {
      allergies: [],
      medications: [],
      vitalSigns: [{ id: 61, visitId: 7 }],
      clinicalNotes: [{ id: 55, visitId: 7, status: 'signed' }],
    },
    isSuccess: true,
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@/app/queries/clinical-masters/allergens/useAllergens', () => ({
  useAllergensQuery: () => ({ data: { data: [] }, isLoading: false, isError: false }),
}));
vi.mock('@/app/queries/identity-access/useCurrentUser', () => ({
  useHasPermission: (key: string) => ({
    data: key === 'visit:amend' && state.canAmend,
    isLoading: false,
  }),
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
    AddNoteSheet: ({ open, note }: { open: boolean; note?: { id: number } | null }) =>
      open ? createElement('div', { 'data-testid': 'note-sheet' }, note?.id ?? 'new') : null,
  };
});
vi.mock('./_sheets/record-vitals-sheet', async () => {
  const { createElement } = await import('react');
  return {
    RecordVitalsSheet: ({ reading }: { reading?: { id: number } | null }) =>
      reading ? createElement('div', { 'data-testid': 'amend-vital-sheet' }, reading.id) : null,
  };
});
vi.mock('./_sheets/amend-visit-sheet', async () => {
  const { createElement } = await import('react');
  return {
    AmendVisitSheet: ({ open }: { open: boolean }) =>
      open ? createElement('div', { 'data-testid': 'amend-visit-sheet' }) : null,
  };
});
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
vi.mock('./visit-patient-header', async () => {
  const { createElement } = await import('react');
  return {
    VisitPatientHeader: ({
      canAmend,
      onAmend,
      onAddAllergy,
      onAddMedication,
    }: {
      canAmend: boolean;
      onAmend: () => void;
      onAddAllergy: () => void;
      onAddMedication: () => void;
    }) =>
      createElement(
        'div',
        null,
        createElement('button', { onClick: onAddAllergy }, 'Add allergy'),
        createElement('button', { onClick: onAddMedication }, 'Add medication'),
        canAmend ? createElement('button', { onClick: onAmend }, 'Amend Visit') : null
      ),
  };
});
vi.mock('./visit-context-pane', () => ({ VisitContextPane: () => null }));
vi.mock('./visit-care-pathway', async () => {
  const { createElement } = await import('react');
  return {
    VisitCarePathway: ({
      onOpenPlanSession,
      onAmendNote,
      onAmendVitalSign,
    }: {
      onOpenPlanSession: (sessionId: number) => void;
      onAmendNote: (noteId: number) => void;
      onAmendVitalSign: (vitalId: number) => void;
    }) =>
      createElement(
        'div',
        null,
        createElement('button', { onClick: () => onOpenPlanSession(902) }, 'Open Session 2'),
        createElement('button', { onClick: () => onAmendNote(55) }, 'Amend note 55'),
        createElement('button', { onClick: () => onAmendVitalSign(61) }, 'Amend reading 61')
      ),
  };
});

afterEach(() => {
  cleanup();
  state.status = 'CHECKED_IN';
  state.canAmend = false;
  state.initialParams = {};
  state.paramWrites = [];
});

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

  it('should open the Amend Visit sheet on a Completed Visit for a user who may amend', () => {
    state.status = 'COMPLETED';
    state.canAmend = true;
    render(createElement(VisitDetailImpl, { visitId: 7 }));

    fireEvent.click(screen.getByRole('button', { name: 'Amend Visit' }));

    expect(screen.getByTestId('amend-visit-sheet')).toBeTruthy();
  });

  it('should not offer Amend Visit without the visit:amend permission', () => {
    state.status = 'COMPLETED';
    render(createElement(VisitDetailImpl, { visitId: 7 }));

    expect(screen.queryByRole('button', { name: 'Amend Visit' })).toBeNull();
  });

  it('should not offer Amend Visit on an active Visit', () => {
    state.canAmend = true;
    render(createElement(VisitDetailImpl, { visitId: 7 }));

    expect(screen.queryByRole('button', { name: 'Amend Visit' })).toBeNull();
  });

  it('should open a signed Clinical Note of a Completed Visit for amendment', () => {
    state.status = 'COMPLETED';
    state.canAmend = true;
    render(createElement(VisitDetailImpl, { visitId: 7 }));

    fireEvent.click(screen.getByRole('button', { name: 'Amend note 55' }));

    expect(screen.getByTestId('note-sheet').textContent).toBe('55');
  });

  it('should open a Vital Sign reading of a Completed Visit for amendment', () => {
    state.status = 'COMPLETED';
    state.canAmend = true;
    render(createElement(VisitDetailImpl, { visitId: 7 }));

    fireEvent.click(screen.getByRole('button', { name: 'Amend reading 61' }));

    expect(screen.getByTestId('amend-vital-sheet').textContent).toBe('61');
  });

  it('should not open amend sheets for a user without the visit:amend permission', () => {
    state.status = 'COMPLETED';
    render(createElement(VisitDetailImpl, { visitId: 7 }));

    fireEvent.click(screen.getByRole('button', { name: 'Amend note 55' }));
    fireEvent.click(screen.getByRole('button', { name: 'Amend reading 61' }));

    expect(screen.queryByTestId('note-sheet')).toBeNull();
    expect(screen.queryByTestId('amend-vital-sheet')).toBeNull();
  });

  it('should clear amend params from a link the user may not open', () => {
    state.status = 'COMPLETED';
    state.initialParams = { amendNote: 55, amendVital: 61 };
    render(createElement(VisitDetailImpl, { visitId: 7 }));

    expect(state.paramWrites).toEqual(
      expect.arrayContaining([
        ['amendNote', null],
        ['amendVital', null],
      ])
    );
    expect(screen.queryByTestId('note-sheet')).toBeNull();
  });

  it('should clear amend params that point outside this Visit', () => {
    state.status = 'COMPLETED';
    state.canAmend = true;
    state.initialParams = { amendNote: 999, amendVital: 998 };
    render(createElement(VisitDetailImpl, { visitId: 7 }));

    expect(state.paramWrites).toEqual(
      expect.arrayContaining([
        ['amendNote', null],
        ['amendVital', null],
      ])
    );
  });

  it('should keep a valid amend param and open its sheet', () => {
    state.status = 'COMPLETED';
    state.canAmend = true;
    state.initialParams = { amendNote: 55 };
    render(createElement(VisitDetailImpl, { visitId: 7 }));

    expect(state.paramWrites).toEqual([]);
    expect(screen.getByTestId('note-sheet').textContent).toBe('55');
  });
});
