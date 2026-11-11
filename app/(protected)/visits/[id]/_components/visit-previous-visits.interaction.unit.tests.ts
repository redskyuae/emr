// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

import { VisitPreviousVisits } from './visit-previous-visits';

const mocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('@/app/queries/visits/useVisits', () => ({ useVisitsQuery: mocks.query }));

function visit(id: number, checkedInAt: string, visitDate: string) {
  return {
    id,
    checkedInAt,
    visitDate,
    status: 'COMPLETED',
    visitNumber: `VST-${id}`,
    patient: { id: 3 },
    doctor: { name: 'Dr. Iyer' },
    visitType: { name: 'Follow-up' },
  } as unknown as Visit;
}

const current = visit(7, '2026-11-05T09:00:00.000Z', '05-11-2026');
const older = visit(5, '2026-09-01T09:00:00.000Z', '01-09-2026');
const newer = visit(6, '2026-10-01T09:00:00.000Z', '01-10-2026');

function renderPanel(notes: ClinicalNote[] = []) {
  render(createElement(VisitPreviousVisits, { visit: current, notes }));
}

beforeEach(() => {
  mocks.query.mockReset().mockReturnValue({
    isLoading: false,
    isError: false,
    data: { data: [older, current, newer] },
  });
});

afterEach(cleanup);

describe('Previous Visits', () => {
  it('should list earlier Visits newest first and leave out this Visit', () => {
    renderPanel();

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      expect.stringContaining('01-10-2026'),
      expect.stringContaining('01-09-2026'),
    ]);
    expect(screen.queryByText('05-11-2026')).toBeNull();
  });

  it('should expand a Visit to show its note and a link to it', () => {
    renderPanel([{ id: 1, visitId: 6, assessment: 'Improving', subjective: null } as ClinicalNote]);

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(screen.getByText('Improving')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open VST-6' }).getAttribute('href')).toBe('/visits/6');
  });

  it('should say so when the Patient has no earlier Visits', () => {
    mocks.query.mockReturnValue({ isLoading: false, isError: false, data: { data: [current] } });
    renderPanel();

    expect(screen.getByText('No earlier Visits for this Patient.')).toBeTruthy();
  });

  it('should offer a retry when Visits cannot be loaded', () => {
    const refetch = vi.fn();
    mocks.query.mockReturnValue({ isLoading: false, isError: true, refetch });
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(refetch).toHaveBeenCalledOnce();
  });
});
