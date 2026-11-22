// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { VisitsQueueEmptyState } from './visits-queue-empty-state';

afterEach(cleanup);

function renderEmptyQueue({ isFiltered, canCreate }: { isFiltered: boolean; canCreate: boolean }) {
  return render(
    createElement(VisitsQueueEmptyState, { visitDate: '21-11-2026', isFiltered, canCreate })
  );
}

describe('Visit queue empty states', () => {
  it('should show the nothing-yet state with Create Visit when no filter is set', () => {
    const { container } = renderEmptyQueue({ isFiltered: false, canCreate: true });

    const root = container.querySelector('[data-slot="empty"]');

    expect(screen.getByText('No Visits for 21-11-2026')).toBeTruthy();
    expect(
      screen.getByText('Create a Visit from a booked Appointment or for a Walk-in Patient.')
    ).toBeTruthy();
    expect(root?.getAttribute('data-tone')).toBe('blue');
    expect(root?.getAttribute('data-size')).toBe('lg');
    expect(container.textContent).not.toMatch(/search|filter|today's queue/i);
    expect(screen.getByRole('link', { name: 'Create Visit' }).getAttribute('href')).toBe(
      '/visits/new'
    );
  });

  it('should not offer Create Visit to a user who may not create Visits', () => {
    renderEmptyQueue({ isFiltered: false, canCreate: false });

    expect(screen.getByText('No Visits for 21-11-2026')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Create Visit' })).toBeNull();
  });

  it('should show the no-results state with no Create Visit when a filter is set', () => {
    const { container } = renderEmptyQueue({ isFiltered: true, canCreate: true });

    const root = container.querySelector('[data-slot="empty"]');

    expect(screen.getByText('No results found')).toBeTruthy();
    expect(screen.getByText('No Visits on 21-11-2026 match the current filters.')).toBeTruthy();
    expect(root?.getAttribute('data-tone')).toBe('neutral');
    expect(screen.queryByRole('link', { name: 'Create Visit' })).toBeNull();
  });
});
