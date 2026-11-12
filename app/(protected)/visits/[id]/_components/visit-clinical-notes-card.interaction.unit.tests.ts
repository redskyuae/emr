// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';

import { VisitClinicalNotesCard } from './visit-clinical-notes-card';

const mocks = vi.hoisted(() => ({ loading: false }));

vi.mock('@/app/queries/clinical-masters/note-types/useClinicalNoteTypes', () => ({
  useClinicalNoteTypesQuery: () => ({
    isLoading: mocks.loading,
    isError: false,
    data: mocks.loading ? undefined : { data: [{ id: 5, name: 'Consultation' }] },
  }),
}));

const note = {
  id: 1,
  visitId: 7,
  noteTypeId: 5,
  status: 'draft',
  subjective: 'Reports back pain',
  objective: 'Tender lumbar spine',
  assessment: 'Mechanical back pain',
  plan: 'Review in two weeks',
} as ClinicalNote;

function renderCard(props: Partial<Parameters<typeof VisitClinicalNotesCard>[0]> = {}) {
  const handlers = {
    onAddClinicalNote: vi.fn(),
    onNursingHandoff: vi.fn(),
    onSignNote: vi.fn(),
  };

  render(
    createElement(VisitClinicalNotesCard, {
      notes: [note],
      loading: false,
      error: false,
      active: true,
      canCreateNote: true,
      ...handlers,
      ...props,
    })
  );

  return handlers;
}

afterEach(() => {
  cleanup();
  mocks.loading = false;
});

describe('Visit Clinical Notes', () => {
  it('should show every SOAP section a Clinical Note holds', () => {
    renderCard();

    for (const text of [
      'Consultation',
      'Reports back pain',
      'Tender lumbar spine',
      'Mechanical back pain',
      'Review in two weeks',
    ]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it('should sign a draft and add notes without mixing up the actions', () => {
    const handlers = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Sign' }));
    expect(handlers.onSignNote).toHaveBeenCalledWith(note);

    fireEvent.click(screen.getByRole('button', { name: 'Nursing handoff' }));
    expect(handlers.onNursingHandoff).toHaveBeenCalledOnce();
    expect(handlers.onAddClinicalNote).not.toHaveBeenCalled();
  });

  it('should hide the add actions on a closed Visit', () => {
    renderCard({ active: false });

    expect(screen.queryByRole('button', { name: /Add note/ })).toBeNull();
  });

  it('should show placeholders before showing an empty state', () => {
    mocks.loading = true;
    renderCard({ notes: [] });

    expect(screen.getByLabelText('Loading Clinical Notes')).toBeTruthy();
    expect(screen.queryByText('No Clinical Notes authored during this Visit.')).toBeNull();
  });
});
