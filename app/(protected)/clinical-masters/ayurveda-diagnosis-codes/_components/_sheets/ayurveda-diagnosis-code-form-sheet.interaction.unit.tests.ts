// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AyurvedaDiagnosisCode } from '@/app/api/lib/modules/ayurveda-diagnosis-code/schemas/ayurveda-diagnosis-code-schema';
import { ApiError } from '@/app/queries/api-error';
import { useCreateAyurvedaDiagnosisCode } from '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useCreateAyurvedaDiagnosisCode';
import { useUpdateAyurvedaDiagnosisCode } from '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useUpdateAyurvedaDiagnosisCode';
import { useDiagnosisCodesQuery } from '@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes';
import { AyurvedaDiagnosisCodeFormSheet } from './ayurveda-diagnosis-code-form-sheet';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast }));
vi.mock(
  '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useCreateAyurvedaDiagnosisCode',
  () => ({ useCreateAyurvedaDiagnosisCode: vi.fn() })
);
vi.mock(
  '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useUpdateAyurvedaDiagnosisCode',
  () => ({ useUpdateAyurvedaDiagnosisCode: vi.fn() })
);
vi.mock('@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes', () => ({
  useDiagnosisCodesQuery: vi.fn(),
}));

const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();

const amavata = {
  id: 31,
  code: 'AYU-AMV',
  name: 'Amavata',
  englishName: 'Rheumatoid arthritis',
  category: 'Vatavyadhi',
  icdDiagnosisCode: { id: 77, code: 'M06.9', title: 'Rheumatoid arthritis, unspecified' },
} as AyurvedaDiagnosisCode;

function renderSheet(ayurvedaDiagnosisCode: AyurvedaDiagnosisCode | null = null) {
  const onClose = vi.fn();
  render(
    createElement(AyurvedaDiagnosisCodeFormSheet, {
      open: true,
      ayurvedaDiagnosisCode,
      isCreating: ayurvedaDiagnosisCode === null,
      onClose,
    })
  );
  return onClose;
}

beforeEach(() => {
  vi.clearAllMocks();
  createMutateAsync.mockResolvedValue({ data: amavata });
  updateMutateAsync.mockResolvedValue({ data: amavata });
  vi.mocked(useCreateAyurvedaDiagnosisCode).mockReturnValue({
    mutateAsync: createMutateAsync,
    isPending: false,
    error: null,
  } as never);
  vi.mocked(useUpdateAyurvedaDiagnosisCode).mockReturnValue({
    mutateAsync: updateMutateAsync,
    isPending: false,
    error: null,
  } as never);
  vi.mocked(useDiagnosisCodesQuery).mockReturnValue({
    data: { data: [{ id: 12, code: 'M54.5', title: 'Low back pain' }] },
    isFetching: false,
    isError: false,
  } as never);
});

afterEach(cleanup);

describe('Ayurveda Diagnosis Code form sheet', () => {
  it('should create a code mapped to the ICD-10-CM code picked from the search', async () => {
    const user = userEvent.setup();
    const onClose = renderSheet();

    await user.type(screen.getByLabelText(/^Code/), 'ayu-ktg');
    await user.type(screen.getByLabelText(/^Name/), 'Katigraha');
    await user.type(screen.getByLabelText('English name'), 'Low back pain');
    await user.type(screen.getByLabelText('Category'), 'Vatavyadhi');
    await user.type(screen.getByPlaceholderText('Search ICD-10-CM code or title'), 'M54');
    await waitFor(() =>
      expect(vi.mocked(useDiagnosisCodesQuery)).toHaveBeenLastCalledWith({
        query: 'M54',
        limit: 50,
      })
    );
    await user.click(await screen.findByText('M54.5'));
    await user.click(screen.getByRole('button', { name: 'Create Ayurveda Diagnosis Code' }));

    await waitFor(() =>
      expect(createMutateAsync).toHaveBeenCalledWith({
        name: 'Katigraha',
        code: 'AYU-KTG',
        category: 'Vatavyadhi',
        englishName: 'Low back pain',
        icdDiagnosisCodeId: 12,
      })
    );
    expect(toast.success).toHaveBeenCalledWith('Ayurveda Diagnosis Code created.');
    expect(onClose).toHaveBeenCalled();
  });

  it('should keep the mapped ICD-10-CM code on edit even when the search does not return it', async () => {
    const user = userEvent.setup();
    renderSheet(amavata);

    expect(
      (screen.getByPlaceholderText('Search ICD-10-CM code or title') as HTMLInputElement).value
    ).toBe('M06.9 — Rheumatoid arthritis, unspecified');

    await user.clear(screen.getByLabelText(/^Name/));
    await user.type(screen.getByLabelText(/^Name/), 'Amavata (chronic)');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(updateMutateAsync).toHaveBeenCalledWith({
        id: 31,
        request: {
          name: 'Amavata (chronic)',
          code: 'AYU-AMV',
          category: 'Vatavyadhi',
          englishName: 'Rheumatoid arthritis',
          icdDiagnosisCodeId: 77,
        },
      })
    );
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it('should send null when no ICD-10-CM code is mapped and block a missing name', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.type(screen.getByLabelText(/^Code/), 'AYU-JWR');
    await user.click(screen.getByRole('button', { name: 'Create Ayurveda Diagnosis Code' }));

    expect(await screen.findByText('Ayurveda diagnosis name is required.')).toBeTruthy();
    expect(createMutateAsync).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/^Name/), 'Jwara');
    await user.click(screen.getByRole('button', { name: 'Create Ayurveda Diagnosis Code' }));

    await waitFor(() =>
      expect(createMutateAsync).toHaveBeenCalledWith({
        name: 'Jwara',
        code: 'AYU-JWR',
        category: undefined,
        englishName: undefined,
        icdDiagnosisCodeId: null,
      })
    );
  });

  it('should show the exact API conflict on the Code field and stay open', async () => {
    const user = userEvent.setup();
    const message = 'Ayurveda diagnosis code AYU-AMV already exists.';
    createMutateAsync.mockRejectedValue(new ApiError(message, [message], 409));
    const onClose = renderSheet();

    await user.type(screen.getByLabelText(/^Code/), 'AYU-AMV');
    await user.type(screen.getByLabelText(/^Name/), 'Amavata');
    await user.click(screen.getByRole('button', { name: 'Create Ayurveda Diagnosis Code' }));

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.getByLabelText(/^Code/).getAttribute('aria-invalid')).toBe('true');
    expect(toast.error).toHaveBeenCalledWith(message);
    expect(onClose).not.toHaveBeenCalled();
  });
});
