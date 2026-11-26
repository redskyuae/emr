// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { createElement, type ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VisitsPageImpl } from './visits-page-impl';

type DoctorScope = { isDoctor: false } | { isDoctor: true; doctorId: number | null };

const mocks = vi.hoisted(() => ({
  visits: vi.fn(),
  doctors: vi.fn(),
  summary: vi.fn(),
  doctorScope: undefined as DoctorScope | undefined,
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/app/queries/identity-access/useCurrentUser', () => ({
  useDoctorScope: () => ({ data: mocks.doctorScope }),
  useHasPermission: () => ({ data: true }),
}));
vi.mock('@/app/queries/visits/useVisits', () => ({
  useVisitsQuery: (...args: unknown[]) => {
    mocks.visits(...args);
    return { isPending: false, isError: false, data: { data: [], meta: { total: 0 } } };
  },
}));
vi.mock('@/app/queries/doctors/useDoctors', () => ({
  useDoctorsQuery: (...args: unknown[]) => {
    mocks.doctors(...args);
    return { isLoading: false, isError: false, data: { data: [{ id: 4, name: 'Dr. Rao' }] } };
  },
}));
vi.mock('@/app/queries/visits/useStartConsultation', () => ({
  useStartConsultation: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));
vi.mock('./visit-queue-summary', () => ({
  VisitQueueSummary: (props: unknown) => {
    mocks.summary(props);
    return null;
  },
}));
vi.mock('./_modals/cancel-visit-dialog', () => ({ CancelVisitDialog: () => null }));

function renderBoard(searchParams = '') {
  return render(
    createElement(
      NuqsTestingAdapter,
      { searchParams } as ComponentProps<typeof NuqsTestingAdapter>,
      createElement(VisitsPageImpl)
    )
  );
}

function lastVisitsCall() {
  return mocks.visits.mock.calls.at(-1) as [{ doctorId?: number }, { enabled?: boolean }];
}

beforeEach(() => {
  mocks.visits.mockReset();
  mocks.doctors.mockReset();
  mocks.summary.mockReset();
  mocks.doctorScope = { isDoctor: false };
});

afterEach(cleanup);

describe('Visits board Doctor scope', () => {
  it('should list only the signed-in Doctor Visits, whatever Doctor the link asks for', () => {
    mocks.doctorScope = { isDoctor: true, doctorId: 12 };

    renderBoard('?doctor=4');

    expect(lastVisitsCall()).toEqual([
      expect.objectContaining({ doctorId: 12 }),
      { enabled: true },
    ]);
    expect(mocks.summary).toHaveBeenLastCalledWith(
      expect.objectContaining({ doctorId: 12, enabled: true })
    );
    expect(screen.queryByRole('combobox', { name: 'Filter by doctor' })).toBeNull();
    expect(mocks.doctors).toHaveBeenLastCalledWith(expect.anything(), { enabled: false });
  });

  it('should let a user without the Doctor Role filter by any Doctor', () => {
    renderBoard('?doctor=4');

    expect(lastVisitsCall()).toEqual([expect.objectContaining({ doctorId: 4 }), { enabled: true }]);
    expect(screen.getByRole('combobox', { name: 'Filter by doctor' })).toBeTruthy();
  });

  it('should list every Doctor Visits for a user without the Doctor Role by default', () => {
    renderBoard();

    expect(lastVisitsCall()).toEqual([
      expect.objectContaining({ doctorId: undefined }),
      { enabled: true },
    ]);
  });

  it('should not list any Visit while the Current User is still loading', () => {
    mocks.doctorScope = undefined;

    renderBoard();

    expect(lastVisitsCall()[1]).toEqual({ enabled: false });
    expect(mocks.summary).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('should explain, and list nothing, when no Doctor is linked to the Doctor user', () => {
    mocks.doctorScope = { isDoctor: true, doctorId: null };

    renderBoard();

    expect(lastVisitsCall()[1]).toEqual({ enabled: false });
    expect(mocks.summary).not.toHaveBeenCalled();
    expect(screen.getByText('No Doctor profile is linked to your account')).toBeTruthy();
  });
});
