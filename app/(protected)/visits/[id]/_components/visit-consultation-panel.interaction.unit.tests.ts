// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { BrandLogoVariant } from '@/components/brand/brand-config';

import { VisitConsultationPanel } from './visit-consultation-panel';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  sign: vi.fn(),
  brand: { variant: 'dhathri-gram' as BrandLogoVariant },
  noteTypes: [] as { id: number; code: string; name: string }[],
}));

vi.mock('@/components/brand/brand-provider', () => ({
  useBrandLogoVariant: () => mocks.brand.variant,
}));

vi.mock('@/app/queries/clinical-masters/note-types/useClinicalNoteTypes', () => ({
  useClinicalNoteTypesQuery: () => ({
    isLoading: false,
    isError: false,
    data: { data: mocks.noteTypes },
  }),
}));
vi.mock('@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes', () => ({
  useDiagnosisCodesQuery: () => ({
    isError: false,
    isFetching: false,
    data: { data: [{ id: 1, code: 'M54', title: 'Dorsalgia' }] },
  }),
}));
vi.mock('@/app/queries/patients/chart/useCreateClinicalNote', () => ({
  useCreateClinicalNote: () => ({ isPending: false, mutateAsync: mocks.create }),
}));
vi.mock('@/app/queries/patients/chart/useUpdateClinicalNote', () => ({
  useUpdateClinicalNote: () => ({ isPending: false, mutateAsync: mocks.update }),
}));
vi.mock('@/app/queries/patients/chart/useSignClinicalNote', () => ({
  useSignClinicalNote: () => ({ isPending: false, mutateAsync: mocks.sign }),
}));
vi.mock('@/components/clinical/rich-text-editor', async () => {
  const { createElement } = await import('react');
  return {
    RichTextEditor: ({
      id,
      value,
      onChange,
      'aria-label': label,
    }: {
      id: string;
      value: string;
      onChange: (value: string) => void;
      'aria-label': string;
    }) =>
      createElement('textarea', {
        id,
        value,
        'aria-label': label,
        onChange: (event: { target: { value: string } }) => onChange(event.target.value),
      }),
  };
});
vi.mock('@/components/ui/combobox', async () => {
  const { createElement } = await import('react');
  const Passthrough = () => createElement('div');
  return {
    Combobox: Passthrough,
    ComboboxContent: Passthrough,
    ComboboxEmpty: Passthrough,
    ComboboxInput: Passthrough,
    ComboboxItem: Passthrough,
    ComboboxList: Passthrough,
  };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const visit = {
  id: 7,
  status: 'IN_CONSULTATION',
  chiefComplaint: 'Back pain',
  patient: { id: 3 },
} as Visit;

function note(overrides: Partial<ClinicalNote>) {
  return {
    id: 20,
    noteTypeId: 5,
    visitId: 7,
    status: 'draft',
    subjective: '**Chief complaint:**\n\nSaved complaint',
    objective: null,
    assessment: null,
    plan: null,
    ...overrides,
  } as ClinicalNote;
}

function renderPanel(
  props: {
    notes?: ClinicalNote[];
    visit?: Visit;
    canStart?: boolean;
    onStart?: () => void;
    slots?: Record<string, ReactNode>;
  } = {},
  variant: BrandLogoVariant = 'dhathri-gram'
) {
  mocks.brand.variant = variant;

  return render(
    createElement(
      NuqsTestingAdapter,
      null,
      createElement(VisitConsultationPanel, {
        visit,
        notes: [],
        chartLoading: false,
        chartError: false,
        canCreateNote: true,
        canStart: false,
        starting: false,
        onStart: vi.fn(),
        onAddNote: vi.fn(),
        onDirtyChange: vi.fn(),
        ...props,
      })
    )
  );
}

function stepButton(name: RegExp | string) {
  return within(screen.getByRole('navigation', { name: 'Consultation steps' })).getByRole(
    'button',
    { name }
  );
}

function openStep(name: RegExp | string) {
  fireEvent.click(stepButton(name));
}

function currentStep() {
  return screen
    .getByRole('navigation', { name: 'Consultation steps' })
    .querySelector('[aria-current="step"]')?.textContent;
}

beforeEach(() => {
  mocks.noteTypes = [
    { id: 5, code: 'CONS', name: 'Consultation' },
    { id: 6, code: 'PROG', name: 'Progress Note' },
  ];
  mocks.create.mockReset().mockResolvedValue({ data: { id: 30 } });
  mocks.update.mockReset().mockResolvedValue({ data: { id: 20 } });
  mocks.sign.mockReset().mockResolvedValue({ data: { id: 20 } });
});

afterEach(cleanup);

describe('Visit consultation', () => {
  it('should prefill the chief complaint from the Visit and create one draft', async () => {
    renderPanel();

    expect((screen.getByLabelText('Chief complaint') as HTMLTextAreaElement).value).toBe(
      'Back pain'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create.mock.calls[0][0]).toMatchObject({
      patientId: 3,
      body: { noteTypeId: 5, visitId: 7, subjective: '**Chief complaint:**\n\nBack pain' },
    });
  });

  it('should update the same note when a new draft is saved twice', async () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    await screen.findByText(/Draft saved at/);

    fireEvent.change(screen.getByLabelText('Present condition / HPI'), {
      target: { value: 'Three weeks' },
    });
    await screen.findByText('Unsaved changes');
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.update.mock.calls[0][0]).toMatchObject({ noteId: 30 });
  });

  it('should resume a saved draft instead of starting a second note', async () => {
    renderPanel({ notes: [note({})] });

    const complaint = screen.getByLabelText('Chief complaint') as HTMLTextAreaElement;
    expect(complaint.value).toBe('Saved complaint');

    fireEvent.change(complaint, { target: { value: 'Worse today' } });
    await screen.findByText('Unsaved changes');
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update.mock.calls[0][0]).toMatchObject({ noteId: 20 });
  });

  it('should save pending changes before signing', async () => {
    renderPanel({ notes: [note({})] });

    fireEvent.change(screen.getByLabelText('Chief complaint'), {
      target: { value: 'Worse today' },
    });
    openStep(/Review & complete/);
    fireEvent.click(screen.getByRole('button', { name: 'Save and sign' }));
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(
      Array.from(dialog.querySelectorAll('button')).find(
        (button) => button.textContent === 'Save and sign'
      )!
    );

    await waitFor(() => expect(mocks.sign).toHaveBeenCalledOnce());
    expect(mocks.sign).toHaveBeenCalledWith({ patientId: 3, noteId: 20 });
    expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.sign.mock.invocationCallOrder[0]
    );
  });

  it('should show the error and not sign when saving fails', async () => {
    mocks.update.mockRejectedValue(new Error('Clinical note 20 is signed and cannot be edited.'));
    renderPanel({ notes: [note({})] });

    openStep(/Review & complete/);
    fireEvent.click(screen.getByRole('button', { name: 'Save and sign' }));
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(
      Array.from(dialog.querySelectorAll('button')).find(
        (button) => button.textContent === 'Save and sign'
      )!
    );

    await screen.findByText('Could not save consultation');
    expect(mocks.sign).not.toHaveBeenCalled();
  });

  it('should show a signed consultation read-only', () => {
    renderPanel({ notes: [note({ status: 'signed' })] });

    expect(screen.getByText('Signed')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
  });

  it('should keep a free-text Consultation draft separate and leave the form open', async () => {
    renderPanel({ notes: [note({ subjective: 'Free-text note' })] });

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('should show a free-text Consultation draft read-only on a closed Visit', () => {
    renderPanel({
      visit: { ...visit, status: 'COMPLETED' },
      notes: [note({ subjective: 'Free-text note' })],
    });

    expect(screen.getByText('Free-text note')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
  });

  it('should save the note as a Consultation without asking for a type', async () => {
    renderPanel();

    expect(screen.queryByLabelText(/Clinical Note Type/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ body: { noteTypeId: 5 } });
  });

  it('should keep the type of a form draft saved under another Clinical Note Type', async () => {
    renderPanel({ notes: [note({ noteTypeId: 6 })] });

    expect(screen.queryByLabelText(/Clinical Note Type/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update.mock.calls[0][0]).toMatchObject({ body: { noteTypeId: 6 } });
  });

  it('should ask for a type instead of guessing when there is no Consultation type', async () => {
    mocks.noteTypes = [{ id: 6, code: 'PROG', name: 'Progress Note' }];
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await screen.findByText('Note type is required.');
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('should ask to start the consultation while the Patient is only checked in', () => {
    const onStart = vi.fn();
    renderPanel({ visit: { ...visit, status: 'CHECKED_IN' }, canStart: true, onStart });

    fireEvent.click(screen.getByRole('button', { name: 'Start consultation' }));

    expect(onStart).toHaveBeenCalledOnce();
    expect(screen.queryByLabelText('Chief complaint')).toBeNull();
  });

  it('should show what was recorded on a closed Visit that has no consultation note', () => {
    renderPanel({
      visit: {
        ...visit,
        status: 'COMPLETED',
        remarks: 'Source visit 2718',
        treatment: { id: 4, name: 'Abhyangam' },
      } as Visit,
    });

    expect(screen.getByText('Visit summary')).toBeTruthy();
    expect(screen.getByText('No consultation note was recorded for this Visit.')).toBeTruthy();
    expect(screen.getByText('Back pain')).toBeTruthy();
    expect(screen.getByText('Abhyangam')).toBeTruthy();
    expect(screen.getByText('Source visit 2718')).toBeTruthy();
    expect(screen.queryByText('No consultation was recorded')).toBeNull();
  });

  it('should keep the empty state on a closed Visit with nothing recorded', () => {
    renderPanel({
      visit: {
        ...visit,
        status: 'COMPLETED',
        chiefComplaint: null,
        remarks: null,
        treatment: null,
      } as Visit,
    });

    expect(screen.getByText('No consultation was recorded')).toBeTruthy();
    expect(screen.queryByText('Visit summary')).toBeNull();
  });

  it('should not show the Visit summary while the Patient is only checked in', () => {
    renderPanel({ visit: { ...visit, status: 'CHECKED_IN' } });

    expect(screen.getByText('Consultation not started')).toBeTruthy();
    expect(screen.queryByText('Visit summary')).toBeNull();
  });

  it('should move through the steps with Continue and Back', () => {
    renderPanel();

    expect(currentStep()).toContain('Subjective');
    expect(screen.queryByRole('button', { name: 'Save and sign' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Continue to Objective/ }));
    expect(currentStep()).toContain('Objective');
    expect(screen.getByRole('group', { name: 'Objective' }).hidden).toBe(false);
    expect(
      (document.querySelector('[aria-labelledby="consult-step-subjective"]') as HTMLElement).hidden
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Back to Subjective' }));
    expect(currentStep()).toContain('Subjective');
  });

  it('should offer signing only on the last step', () => {
    renderPanel();

    openStep(/Review & complete/);

    expect(screen.getByRole('button', { name: 'Save and sign' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Continue to/ })).toBeNull();
  });

  it('should show how many fields each step has filled', () => {
    renderPanel();

    expect(stepButton(/Subjective/).textContent).toContain('1/5');
    expect(stepButton(/Objective/).textContent).toContain('0/3');
  });

  it('should open the step that holds the first error when saving fails validation', async () => {
    renderPanel();

    fireEvent.change(screen.getByLabelText('Chief complaint'), { target: { value: '' } });
    openStep(/Assessment/);
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await screen.findByText('Chief complaint is required.');
    expect(currentStep()).toContain('Subjective');
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('should show the Step slots the Visit passes in', () => {
    const panel = createElement(VisitConsultationPanel, {
      visit,
      notes: [],
      chartLoading: false,
      chartError: false,
      canCreateNote: true,
      canStart: false,
      starting: false,
      onStart: vi.fn(),
      onAddNote: vi.fn(),
      onDirtyChange: vi.fn(),
      slots: { plan: createElement('p', null, 'Session 5 card') },
    });
    render(
      createElement(
        NuqsTestingAdapter as (props: { searchParams: string }) => ReactNode,
        { searchParams: '?step=plan' },
        panel
      )
    );

    expect(currentStep()).toContain('Plan & Session');
    expect(screen.getByText('Session 5 card')).toBeTruthy();
  });

  it('should keep the Visit records in their steps on a closed Visit', () => {
    renderPanel({
      visit: { ...visit, status: 'COMPLETED' },
      notes: [note({ status: 'signed' })],
      slots: {
        subjective: createElement('p', null, 'Visit details card'),
        review: createElement('p', null, 'Billing for this Visit'),
      },
    });

    expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
    expect(screen.getByText('Visit details card')).toBeTruthy();
    expect(screen.getByText('Signed')).toBeTruthy();

    openStep(/Review & complete/);
    expect(currentStep()).toContain('Review & complete');
    expect(screen.getByText('Billing for this Visit')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save and sign' })).toBeNull();
  });

  it('should show the Ayurvedic fields only on Ayurveda deployments', () => {
    renderPanel({}, 'dhathri-ayurvedic');
    expect(screen.getByLabelText('Prakriti')).toBeTruthy();
    expect(screen.getByLabelText('Ayurvedic diagnosis')).toBeTruthy();
    cleanup();

    renderPanel({}, 'none');
    expect(screen.queryByLabelText('Prakriti')).toBeNull();
    expect(screen.queryByLabelText('Ayurvedic diagnosis')).toBeNull();
    expect(screen.getByLabelText('Chief complaint')).toBeTruthy();
  });
});
