// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAyurvedaDiagnosisCodesQuery } from '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useAyurvedaDiagnosisCodes';
import { useDiagnosisCodesQuery } from '@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { useCreateClinicalNote } from '@/app/queries/patients/chart/useCreateClinicalNote';
import { DoctorConsultationSheet } from './doctor-consultation-sheet';

vi.mock('@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes', () => ({
  useDiagnosisCodesQuery: vi.fn(),
}));
vi.mock(
  '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useAyurvedaDiagnosisCodes',
  () => ({ useAyurvedaDiagnosisCodesQuery: vi.fn() })
);
vi.mock('@/app/queries/clinical-masters/note-types/useClinicalNoteTypes', () => ({
  useClinicalNoteTypesQuery: vi.fn(),
}));
vi.mock('@/app/queries/patients/chart/useCreateClinicalNote', () => ({
  useCreateClinicalNote: vi.fn(),
}));
vi.mock('@/components/clinical/rich-text-editor', () => ({ RichTextEditor: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const diagnosisCodes = vi.mocked(useDiagnosisCodesQuery);
const ayurvedaDiagnosisCodes = vi.mocked(useAyurvedaDiagnosisCodesQuery);
const noteTypes = vi.mocked(useClinicalNoteTypesQuery);
const createNote = vi.mocked(useCreateClinicalNote);
const mutateAsync = vi.fn();
const onClose = vi.fn();

function renderSheet() {
  return render(
    createElement(DoctorConsultationSheet, {
      open: true,
      patientId: 7,
      visitId: 11,
      chiefComplaint: 'Low back pain',
      onClose,
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mutateAsync.mockResolvedValue({ data: { id: 1 } });
  createNote.mockReturnValue({ mutateAsync, isPending: false } as never);
  noteTypes.mockReturnValue({
    data: { data: [{ id: 3, code: 'CONS', name: 'Consultation' }] },
    isLoading: false,
    isError: false,
  } as never);
  diagnosisCodes.mockReturnValue({
    data: { data: [{ id: 21, code: 'M54', title: 'Dorsalgia (back pain)', isActive: true }] },
    isFetching: false,
    isError: false,
  } as never);
  ayurvedaDiagnosisCodes.mockReturnValue({
    data: { data: [{ id: 31, code: 'AYU-GRIDHRASI', title: 'Gridhrasi (Sciatica)' }] },
    isFetching: false,
    isError: false,
  } as never);
});

afterEach(cleanup);

describe('Doctor consultation sheet', () => {
  it('should only ask for active codes in both pickers', () => {
    renderSheet();

    expect(diagnosisCodes).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
    expect(ayurvedaDiagnosisCodes).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true })
    );
  });

  it('should save both selected codes as references and as note text', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole('combobox', { name: 'Diagnosis Code' }));
    await user.click(await screen.findByRole('option', { name: /Dorsalgia/ }));
    await user.click(screen.getByRole('combobox', { name: 'Ayurveda Diagnosis Code' }));
    await user.click(await screen.findByRole('option', { name: /Gridhrasi/ }));
    await user.click(screen.getByRole('button', { name: 'Save consultation' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith({
      patientId: 7,
      body: expect.objectContaining({
        visitId: 11,
        noteTypeId: 3,
        diagnosisCodeId: 21,
        ayurvedaDiagnosisCodeId: 31,
        assessment:
          'Diagnosis Code: M54 — Dorsalgia (back pain)\n\nAyurveda Diagnosis Code: AYU-GRIDHRASI — Gridhrasi (Sciatica)',
      }),
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('should not search the catalogue with the label of the selected code', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole('combobox', { name: 'Diagnosis Code' }));
    await user.click(await screen.findByRole('option', { name: /Dorsalgia/ }));
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(
      (screen.getByRole('combobox', { name: 'Diagnosis Code' }) as HTMLInputElement).value
    ).toBe('M54 · Dorsalgia (back pain)');
    expect(diagnosisCodes.mock.lastCall?.[0].query).toBeUndefined();
  });

  it('should search the catalogue with typed text', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.type(screen.getByRole('combobox', { name: 'Diagnosis Code' }), 'dors');

    await waitFor(() => expect(diagnosisCodes.mock.lastCall?.[0].query).toBe('dors'));
  });

  it('should save a consultation without coded diagnoses', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole('button', { name: 'Save consultation' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync.mock.calls[0][0].body).toMatchObject({
      diagnosisCodeId: undefined,
      ayurvedaDiagnosisCodeId: undefined,
    });
  });

  it('should show when a catalogue could not be loaded', () => {
    ayurvedaDiagnosisCodes.mockReturnValue({
      data: undefined,
      isFetching: false,
      isError: true,
    } as never);

    renderSheet();

    expect(screen.getByText('Ayurveda Diagnosis Codes could not be loaded.')).toBeTruthy();
  });
});
