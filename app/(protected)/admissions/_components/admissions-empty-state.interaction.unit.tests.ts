// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdmissionsEmptyState } from './admissions-empty-state';

afterEach(cleanup);

function renderEmptyCensus({
  isFiltered,
  canCreate,
  onAdmit = () => undefined,
}: {
  isFiltered: boolean;
  canCreate: boolean;
  onAdmit?: () => void;
}) {
  return render(createElement(AdmissionsEmptyState, { isFiltered, canCreate, onAdmit }));
}

describe('Admissions census empty states', () => {
  it('should show the nothing-yet state with Admit Patient when no filter is set', async () => {
    const onAdmit = vi.fn();
    const { container } = renderEmptyCensus({ isFiltered: false, canCreate: true, onAdmit });

    const root = container.querySelector('[data-slot="empty"]');

    expect(screen.getByText('No current Admissions')).toBeTruthy();
    expect(
      screen.getByText(
        'Admit a Patient to a free Bed to start the inpatient census. Configure Wards and Beds under Inpatient Masters first.'
      )
    ).toBeTruthy();
    expect(root?.getAttribute('data-tone')).toBe('sky');
    expect(root?.getAttribute('data-size')).toBe('lg');
    expect(container.textContent).not.toMatch(/search|filter/i);

    await userEvent.click(screen.getByRole('button', { name: 'Admit Patient' }));

    expect(onAdmit).toHaveBeenCalledTimes(1);
  });

  it('should not offer Admit Patient to a user who may not admit', () => {
    renderEmptyCensus({ isFiltered: false, canCreate: false });

    expect(screen.getByText('No current Admissions')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Admit Patient' })).toBeNull();
  });

  it('should show the no-results state with no Admit Patient when a filter is set', () => {
    const { container } = renderEmptyCensus({ isFiltered: true, canCreate: true });

    const root = container.querySelector('[data-slot="empty"]');

    expect(screen.getByText('No results found')).toBeTruthy();
    expect(screen.getByText('No Admissions match the current search and filters.')).toBeTruthy();
    expect(root?.getAttribute('data-tone')).toBe('neutral');
    expect(screen.queryByRole('button', { name: 'Admit Patient' })).toBeNull();
  });
});
