// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AppointmentDaySection } from './appointment-day-section';

afterEach(cleanup);

function renderEmptySection(
  kind: 'today' | 'upcoming',
  { isFiltered, canCreate }: { isFiltered: boolean; canCreate: boolean }
) {
  return render(
    createElement(AppointmentDaySection, {
      kind,
      isFiltered,
      canCreate,
      page: 1,
      total: 0,
      pageSize: 5,
      totalPages: 0,
      appointments: [],
      isLoading: false,
      isFetching: false,
      id: `${kind}-appointments`,
      title: kind === 'today' ? "Today's Appointments" : 'Upcoming Appointments',
      description: 'Appointments in this view.',
      onCancel: () => undefined,
      onPageChange: () => undefined,
    })
  );
}

function emptyState(container: HTMLElement) {
  return container.querySelector('[data-slot="empty"]');
}

describe('Appointment tab empty states', () => {
  it.each([
    ['today', 'No Appointments today', 'Appointments booked for today appear here.'],
    [
      'upcoming',
      'No upcoming Appointments',
      'Future Appointments appear here once they are booked.',
    ],
  ] as const)(
    'should show the nothing-yet state on the %s tab with no filter set',
    (kind, title, description) => {
      const { container } = renderEmptySection(kind, { isFiltered: false, canCreate: true });

      const root = emptyState(container);

      expect(screen.getByText(title)).toBeTruthy();
      expect(screen.getByText(description)).toBeTruthy();
      expect(root?.getAttribute('data-tone')).toBe('teal');
      expect(root?.getAttribute('data-size')).toBe('lg');
      expect(container.textContent).not.toMatch(/filter/i);
      expect(screen.getByRole('link', { name: 'Book Appointment' }).getAttribute('href')).toBe(
        '/appointments/new'
      );
    }
  );

  it('should not offer Book Appointment to a user who may not book', () => {
    renderEmptySection('today', { isFiltered: false, canCreate: false });

    expect(screen.getByText('No Appointments today')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Book Appointment' })).toBeNull();
  });

  it.each([
    ['today', 'No Appointments scheduled for today match the current filters.'],
    ['upcoming', 'No future Appointments match the current filters.'],
  ] as const)(
    'should show the no-results state on the %s tab with a filter set',
    (kind, description) => {
      const { container } = renderEmptySection(kind, { isFiltered: true, canCreate: true });

      const root = emptyState(container);

      expect(screen.getByText('No results found')).toBeTruthy();
      expect(screen.getByText(description)).toBeTruthy();
      expect(root?.getAttribute('data-tone')).toBe('neutral');
      expect(screen.queryByRole('link', { name: 'Book Appointment' })).toBeNull();
    }
  );
});
