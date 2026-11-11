// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

import { CompleteVisitDialog } from './complete-visit-dialog';

const mocks = vi.hoisted(() => ({ complete: vi.fn(), toastError: vi.fn() }));

vi.mock('@/app/queries/visits/useCompleteVisit', () => ({
  useCompleteVisit: () => ({ isPending: false, mutateAsync: mocks.complete }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: mocks.toastError } }));

const visit = {
  id: 7,
  visitNumber: 'VST-1007',
  patient: { firstName: 'Asha', lastName: 'Rao' },
} as Visit;

function renderDialog(outstanding: string[], onClose = vi.fn()) {
  render(createElement(CompleteVisitDialog, { visit, open: true, outstanding, onClose }));
  return onClose;
}

beforeEach(() => {
  mocks.complete.mockReset().mockResolvedValue({ data: visit });
  mocks.toastError.mockReset();
});

afterEach(cleanup);

describe('Complete Visit dialog', () => {
  it('should warn about open items without blocking completion', async () => {
    const onClose = renderDialog(['No Invoice linked to this Visit.']);

    expect(screen.getByText('No Invoice linked to this Visit.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Complete Visit' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(mocks.complete).toHaveBeenCalledWith(7);
  });

  it('should not show the warning when nothing is open', () => {
    renderDialog([]);

    expect(screen.queryByText('Still open on this Visit')).toBeNull();
  });

  it('should stay open and show the error when completion fails', async () => {
    mocks.complete.mockRejectedValue(new Error('VST-1007 cannot be completed.'));
    const onClose = renderDialog([]);

    fireEvent.click(screen.getByRole('button', { name: 'Complete Visit' }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledOnce());
    expect(onClose).not.toHaveBeenCalled();
  });
});
