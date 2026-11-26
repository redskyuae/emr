// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VisitDiagnosis } from '@/app/api/lib/modules/visit-diagnosis/schemas/visit-diagnosis-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useSaveVisitDiagnoses } from '@/app/queries/visits/useSaveVisitDiagnoses';
import { useVisitDiagnosesQuery } from '@/app/queries/visits/useVisitDiagnoses';
import { VisitDiagnosesPanel } from './visit-diagnoses-panel';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const permissions = vi.hoisted(() => ({ granted: new Set<string>() }));

vi.mock('sonner', () => ({ toast }));
vi.mock('@/app/queries/visits/useVisitDiagnoses', () => ({ useVisitDiagnosesQuery: vi.fn() }));
vi.mock('@/app/queries/identity-access/useCurrentUser', () => ({
  useHasPermission: (permission: string) => ({
    data: permissions.granted.has(permission),
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@/app/queries/visits/useSaveVisitDiagnoses', () => ({ useSaveVisitDiagnoses: vi.fn() }));
vi.mock('@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes', () => ({
  useDiagnosisCodesQuery: () => ({ data: { data: [] }, isFetching: false, isError: false }),
}));
vi.mock(
  '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useAyurvedaDiagnosisCodes',
  () => ({
    useAyurvedaDiagnosisCodesQuery: () => ({
      data: { data: [] },
      isFetching: false,
      isError: false,
    }),
  })
);

const mutateAsync = vi.fn();
const visit = { id: 5120 } as unknown as Visit;

function diagnosis(overrides: Partial<VisitDiagnosis>): VisitDiagnosis {
  return {
    id: 1,
    visitId: 5120,
    codeSystem: 'ICD10CM',
    diagnosisType: 'PRINCIPAL',
    sortOrder: 0,
    notes: null,
    code: 'M06.9',
    title: 'Rheumatoid arthritis, unspecified',
    englishName: null,
    diagnosisCodeId: 12,
    ayurvedaDiagnosisCodeId: null,
    icdMapping: null,
    ...overrides,
  };
}

const saved = [
  diagnosis({}),
  diagnosis({
    id: 2,
    sortOrder: 1,
    diagnosisType: 'SECONDARY',
    code: 'M54.5',
    title: 'Low back pain',
    diagnosisCodeId: 13,
  }),
  diagnosis({
    id: 3,
    codeSystem: 'AYURVEDA',
    code: 'AYU-AMV',
    title: 'Amavata',
    englishName: 'Rheumatoid arthritis',
    diagnosisCodeId: null,
    ayurvedaDiagnosisCodeId: 4,
    icdMapping: { id: 12, code: 'M06.9', title: 'Rheumatoid arthritis, unspecified' },
  }),
];

function renderPanel(mode: 'edit' | 'amend' | 'read', showAyurveda = true) {
  render(createElement(VisitDiagnosesPanel, { visit, mode, showAyurveda }));
}

beforeEach(() => {
  vi.clearAllMocks();
  permissions.granted = new Set(['visit-diagnosis:read']);
  mutateAsync.mockResolvedValue({ data: saved });
  vi.mocked(useVisitDiagnosesQuery).mockReturnValue({
    data: saved,
    isLoading: false,
    isError: false,
  } as never);
  vi.mocked(useSaveVisitDiagnoses).mockReturnValue({ mutateAsync, isPending: false } as never);
});

afterEach(cleanup);

describe('Visit diagnoses panel', () => {
  it('should show Primary and Secondary diagnoses read-only with the Ayurveda claim mapping', () => {
    renderPanel('read');

    const icd = screen.getByRole('region', { name: 'ICD-10-CM' });
    expect(within(icd).getByText('Primary')).toBeTruthy();
    expect(within(icd).getByText('Secondary')).toBeTruthy();
    expect(within(icd).getByText('Low back pain', { exact: false })).toBeTruthy();
    const ayurveda = screen.getByRole('region', { name: 'Ayurveda' });
    expect(within(ayurveda).getByText(/Claims as/).textContent).toContain('M06.9');
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
    expect(screen.queryByLabelText('Primary diagnosis')).toBeNull();
  });

  it('should open the Primary and Secondary dropdowns on the recorded codes', () => {
    renderPanel('edit');

    expect(
      (
        screen.getByLabelText('Primary diagnosis', {
          selector: '#diagnosis-icd-primary',
        }) as HTMLInputElement
      ).value
    ).toBe('M06.9 — Rheumatoid arthritis, unspecified');
    const icd = screen.getByRole('region', { name: 'ICD-10-CM' });
    expect(within(icd).getByText('M54.5')).toBeTruthy();
    const ayurveda = screen.getByRole('region', { name: 'Ayurveda' });
    expect(
      within(ayurveda).getByText('Claims as M06.9 — Rheumatoid arthritis, unspecified.')
    ).toBeTruthy();
  });

  it('should save a removed Secondary for an Active Visit', async () => {
    const user = userEvent.setup();
    renderPanel('edit');

    const chip = screen.getByLabelText('M54.5 — Low back pain');
    await user.click(within(chip).getByRole('button'));
    await user.click(screen.getByRole('button', { name: 'Save diagnoses' }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        visitId: 5120,
        amend: false,
        request: {
          diagnoses: [
            {
              codeSystem: 'AYURVEDA',
              ayurvedaDiagnosisCodeId: 4,
              diagnosisType: 'PRINCIPAL',
              notes: null,
            },
            {
              codeSystem: 'ICD10CM',
              diagnosisCodeId: 12,
              diagnosisType: 'PRINCIPAL',
              notes: null,
            },
          ],
        },
      })
    );
    expect(toast.success).toHaveBeenCalledWith('Diagnoses saved.');
  });

  it('should amend a Completed Visit through the amend endpoint', async () => {
    const user = userEvent.setup();
    renderPanel('amend');

    const chip = screen.getByLabelText('M54.5 — Low back pain');
    await user.click(within(chip).getByRole('button'));
    await user.click(screen.getByRole('button', { name: 'Save amendment' }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ amend: true, visitId: 5120 })
      )
    );
    expect(toast.success).toHaveBeenCalledWith('Diagnoses amended.');
  });

  it('should keep Save disabled until something changes', () => {
    renderPanel('edit');

    expect(
      (screen.getByRole('button', { name: 'Save diagnoses' }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it('should load the Visit Diagnoses only with visit-diagnosis:read', () => {
    renderPanel('read');

    expect(useVisitDiagnosesQuery).toHaveBeenCalledWith(5120, { enabled: true });
  });

  it('should not load or show Visit Diagnoses without visit-diagnosis:read', () => {
    permissions.granted = new Set();
    renderPanel('edit');

    expect(useVisitDiagnosesQuery).toHaveBeenCalledWith(5120, { enabled: false });
    expect(screen.getByText('You do not have permission to view Visit Diagnoses.')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'ICD-10-CM' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
  });

  it('should hide the Ayurveda column on a non-Ayurveda deployment with no Ayurveda codes', () => {
    vi.mocked(useVisitDiagnosesQuery).mockReturnValue({
      data: saved.slice(0, 2),
      isLoading: false,
      isError: false,
    } as never);
    renderPanel('edit', false);

    expect(screen.queryByRole('region', { name: 'Ayurveda' })).toBeNull();
    expect(screen.getByRole('region', { name: 'ICD-10-CM' })).toBeTruthy();
  });
});
