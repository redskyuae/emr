// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PatientsTable } from './patients-table';

afterEach(cleanup);

function renderEmptyTable({ isFiltered, canCreate }: { isFiltered: boolean; canCreate: boolean }) {
  return render(
    createElement(PatientsTable, {
      isFiltered,
      canCreate,
      page: 1,
      error: null,
      patients: [],
      meta: undefined,
      isError: false,
      isLoading: false,
      isFetching: false,
      onPageChange: () => undefined,
    })
  );
}

describe('Patients list empty states', () => {
  it('should show the nothing-yet state with Register patient when no filter is set', () => {
    const { container } = renderEmptyTable({ isFiltered: false, canCreate: true });

    const root = container.querySelector('[data-slot="empty"]');

    expect(screen.getByText('No Patients yet')).toBeTruthy();
    expect(screen.getByText('Register the first Patient to start their record.')).toBeTruthy();
    expect(root?.getAttribute('data-tone')).toBe('violet');
    expect(root?.getAttribute('data-size')).toBe('lg');
    expect(container.textContent).not.toMatch(/search|filter/i);
    expect(screen.getByRole('link', { name: 'Register patient' }).getAttribute('href')).toBe(
      '/patients/new'
    );
  });

  it('should not offer Register patient to a user who may not register', () => {
    renderEmptyTable({ isFiltered: false, canCreate: false });

    expect(screen.getByText('No Patients yet')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Register patient' })).toBeNull();
  });

  it('should show the no-results state with no register button when a filter is set', () => {
    const { container } = renderEmptyTable({ isFiltered: true, canCreate: true });

    const root = container.querySelector('[data-slot="empty"]');

    expect(screen.getByText('No results found')).toBeTruthy();
    expect(screen.getByText('No Patients match the current search and filters.')).toBeTruthy();
    expect(root?.getAttribute('data-tone')).toBe('neutral');
    expect(screen.queryByRole('link', { name: 'Register patient' })).toBeNull();
  });
});
