// @vitest-environment jsdom

import { createElement, type ComponentProps } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CollapsibleFilterToolbar, FilterSelect } from './collapsible-filter-toolbar';

afterEach(cleanup);

type ToolbarProps = ComponentProps<typeof CollapsibleFilterToolbar>;

function renderToolbar({
  advancedCount = 0,
  defaultExpanded = false,
}: { advancedCount?: number; defaultExpanded?: boolean } = {}) {
  // `children` is passed as an argument, so the props object is cast to the full prop type.
  const props: Omit<ToolbarProps, 'children'> = {
    advancedCount,
    defaultExpanded,
    actions: createElement('button', { type: 'button' }, 'Apply filters'),
    advanced: createElement('input', { 'aria-label': 'Doctor' }),
  };

  return render(
    createElement(
      CollapsibleFilterToolbar,
      props as ToolbarProps,
      createElement('input', { 'aria-label': 'Search Visits' })
    )
  );
}

function toggleButton() {
  return screen.getByRole('button', { name: /advanced filters/i });
}

function advancedRegion() {
  const id = toggleButton().getAttribute('aria-controls');

  return document.getElementById(id ?? '') as HTMLElement;
}

describe('CollapsibleFilterToolbar', () => {
  it('should start collapsed with the advanced rows hidden and inert', () => {
    renderToolbar();

    expect(toggleButton()).toHaveProperty('ariaExpanded', 'false');
    expect(advancedRegion().hidden).toBe(true);
    expect(advancedRegion().hasAttribute('inert')).toBe(true);
    expect(screen.queryByRole('textbox', { name: 'Doctor' })).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Search Visits' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Apply filters' })).toBeTruthy();
  });

  it('should point aria-controls at the advanced rows', () => {
    renderToolbar();

    expect(advancedRegion()).not.toBeNull();
    expect(advancedRegion().contains(document.querySelector('[aria-label="Doctor"]'))).toBe(true);
  });

  it('should name the toggle with the applied advanced count while collapsed', () => {
    renderToolbar({ advancedCount: 2 });

    expect(toggleButton().textContent).toBe('Advanced filters· 2');
    expect(screen.getByRole('button', { name: 'Advanced filters, 2 applied' })).toBeTruthy();
  });

  it('should show no count when no advanced filter is applied', () => {
    renderToolbar({ advancedCount: 0 });

    expect(screen.getByRole('button', { name: 'Advanced filters' })).toBeTruthy();
  });

  it('should start expanded when asked to and show no count', () => {
    renderToolbar({ advancedCount: 2, defaultExpanded: true });

    expect(screen.getByRole('button', { name: 'Hide advanced filters' })).toBeTruthy();
    expect(toggleButton()).toHaveProperty('ariaExpanded', 'true');
    expect(advancedRegion().hidden).toBe(false);
    expect(advancedRegion().hasAttribute('inert')).toBe(false);
    expect(screen.getByRole('textbox', { name: 'Doctor' })).toBeTruthy();
  });

  it('should expand and collapse at once when reduced motion is preferred', () => {
    renderToolbar({ advancedCount: 1 });

    fireEvent.click(toggleButton());

    expect(screen.getByRole('button', { name: 'Hide advanced filters' })).toBeTruthy();
    expect(advancedRegion().hidden).toBe(false);
    expect(advancedRegion().hasAttribute('inert')).toBe(false);

    fireEvent.click(toggleButton());

    expect(screen.getByRole('button', { name: 'Advanced filters, 1 applied' })).toBeTruthy();
    expect(advancedRegion().hidden).toBe(true);
    expect(advancedRegion().hasAttribute('inert')).toBe(true);
  });

  it('should make the rows inert as soon as a collapse starts when motion is allowed', () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as typeof window.matchMedia;

    try {
      renderToolbar({ defaultExpanded: true });

      fireEvent.click(toggleButton());

      expect(toggleButton()).toHaveProperty('ariaExpanded', 'false');
      expect(advancedRegion().hasAttribute('inert')).toBe(true);
    } finally {
      window.matchMedia = matchMedia;
    }
  });
});

describe('FilterSelect', () => {
  it('should show the all label when no value is chosen', () => {
    render(
      createElement(FilterSelect, {
        label: 'Filter by Doctor',
        value: null,
        allLabel: 'All Doctors',
        options: [{ value: '7', label: 'Dr. Meera Nair' }],
        onChange: () => {},
      })
    );

    expect(screen.getByRole('combobox', { name: 'Filter by Doctor' }).textContent).toBe(
      'All Doctors'
    );
  });
});
