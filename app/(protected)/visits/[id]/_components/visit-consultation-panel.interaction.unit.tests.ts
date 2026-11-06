// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
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
  props: { notes?: ClinicalNote[]; visit?: Visit; canStart?: boolean } = {},
  variant: BrandLogoVariant = 'dhathri-gram'
) {
  mocks.brand.variant = variant;

  return render(
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
  );
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

  it('should default to the Consultation type and save the type the Doctor picks', async () => {
    renderPanel();

    const noteType = screen.getByLabelText(/Clinical Note Type/) as HTMLSelectElement;
    expect(noteType.value).toBe('5');

    fireEvent.change(noteType, { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ body: { noteTypeId: 6 } });
  });

  it('should resume a form draft saved under another Clinical Note Type', async () => {
    renderPanel({ notes: [note({ noteTypeId: 6 })] });

    expect((screen.getByLabelText(/Clinical Note Type/) as HTMLSelectElement).value).toBe('6');

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
    expect(mocks.create).not.toHaveBeenCalled();
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
    render(
      createElement(VisitConsultationPanel, {
        visit: { ...visit, status: 'CHECKED_IN' },
        notes: [],
        chartLoading: false,
        chartError: false,
        canCreateNote: true,
        canStart: true,
        starting: false,
        onStart,
        onAddNote: vi.fn(),
        onDirtyChange: vi.fn(),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start consultation' }));

    expect(onStart).toHaveBeenCalledOnce();
    expect(screen.queryByLabelText('Chief complaint')).toBeNull();
  });

  it('should link to every section and show how many fields are filled', () => {
    renderPanel();

    const presenting = screen.getByRole('link', { name: /Presenting complaint/ });

    expect(presenting.getAttribute('href')).toBe('#consult-presenting');
    expect(presenting.textContent).toContain('1/2');
    expect(screen.getByRole('link', { name: /History/ }).textContent).toContain('0/3');
    expect(document.getElementById('consult-plan')).toBeTruthy();
  });

  it('should show the Ayurvedic assessment only on Ayurveda deployments', () => {
    renderPanel({}, 'dhathri-ayurvedic');
    expect(screen.getByRole('link', { name: /Ayurvedic assessment/ })).toBeTruthy();
    expect(screen.getByLabelText('Prakriti')).toBeTruthy();
    cleanup();

    renderPanel({}, 'none');
    expect(screen.queryByRole('link', { name: /Ayurvedic assessment/ })).toBeNull();
    expect(screen.queryByLabelText('Prakriti')).toBeNull();
    expect(screen.getByLabelText('Chief complaint')).toBeTruthy();
  });
});
