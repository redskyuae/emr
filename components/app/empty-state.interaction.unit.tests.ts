// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { PiCalendarBlankDuotone } from 'react-icons/pi';
import { afterEach, describe, expect, it } from 'vitest';

import { EmptyState } from './empty-state';

afterEach(cleanup);

function renderEmptyState(props: Partial<Parameters<typeof EmptyState>[0]> = {}) {
  return render(
    createElement(EmptyState, {
      tone: 'teal',
      icon: PiCalendarBlankDuotone,
      title: 'No upcoming Appointments',
      description: 'Future Appointments appear here once they are booked.',
      ...props,
    })
  );
}

describe('EmptyState', () => {
  it('should draw the orbit at the large and medium sizes', () => {
    for (const size of ['lg', 'md'] as const) {
      const { container } = renderEmptyState({ size });

      expect(container.querySelector('[data-slot="empty-state-orbit"]')).not.toBeNull();
      expect(container.querySelectorAll('[data-slot="empty-state-satellite"]')).toHaveLength(7);
      cleanup();
    }
  });

  it('should never draw the orbit at the small size', () => {
    const { container } = renderEmptyState({ size: 'sm' });

    expect(container.querySelector('[data-slot="empty-state-orbit"]')).toBeNull();
    expect(container.querySelector('[data-slot="empty-state-icon"]')).not.toBeNull();
  });

  it('should drop the orbit at any size when orbit is off', () => {
    const { container } = renderEmptyState({ size: 'lg', orbit: false, tone: 'danger' });

    expect(container.querySelector('[data-slot="empty-state-orbit"]')).toBeNull();
    expect(container.querySelector('[data-slot="empty-state-icon"]')).not.toBeNull();
  });

  it('should hide the centre icon and the orbit from screen readers', () => {
    const { container } = renderEmptyState();

    const icon = container.querySelector('[data-slot="empty-state-icon"]');
    const orbit = container.querySelector('[data-slot="empty-state-orbit"] > svg');

    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(orbit?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should render the title, description, children and actions in reading order', () => {
    const { container } = renderEmptyState({
      children: createElement('p', null, 'A hint'),
      actions: createElement('button', { type: 'button' }, 'Book Appointment'),
    });

    const text = container.textContent ?? '';
    const order = [
      'No upcoming Appointments',
      'Future Appointments appear here once they are booked.',
      'A hint',
      'Book Appointment',
    ].map((part) => text.indexOf(part));

    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(screen.getByRole('button', { name: 'Book Appointment' })).toBeTruthy();
  });

  it('should leave out the description and actions when none are given', () => {
    const { container } = renderEmptyState({ description: undefined });

    expect(container.querySelector('[data-slot="empty-description"]')).toBeNull();
    expect(container.querySelector('[data-slot="empty-content"]')).toBeNull();
  });

  it('should keep the empty slot and mark its size and tone on the root', () => {
    const { container } = renderEmptyState({ size: 'md', tone: 'neutral' });

    const root = container.firstElementChild;

    expect(root?.getAttribute('data-slot')).toBe('empty');
    expect(root?.getAttribute('data-size')).toBe('md');
    expect(root?.getAttribute('data-tone')).toBe('neutral');
  });

  it('should colour the centre icon from the tone token', () => {
    const { container } = renderEmptyState({ tone: 'amber' });

    const icon = container.querySelector('[data-slot="empty-state-icon"]');

    expect(icon?.className).toContain('text-tone-amber');
  });
});
