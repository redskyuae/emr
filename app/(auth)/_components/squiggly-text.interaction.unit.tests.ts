// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { createElement, type ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SquigglyText } from './squiggly-text';

const filter = vi.hoisted(() => ({ set: vi.fn() }));

vi.mock('motion/react', () => ({
  motion: {
    // The motion value is asserted through `filter.set`; the span itself renders plainly.
    span: ({ className, children }: ComponentProps<'span'>) =>
      createElement('span', { className }, children),
  },
  useMotionValue: () => filter,
}));

function setReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduced }) as typeof window.matchMedia;
}

type SquigglyTextProps = ComponentProps<typeof SquigglyText>;

function renderSquiggly(props: Omit<SquigglyTextProps, 'children'> = {}) {
  // `children` is passed as an argument, so the props object is cast to the full prop type.
  return render(
    createElement(SquigglyText, props as SquigglyTextProps, 'Care rooted in Ayurveda.')
  );
}

function appliedFilters() {
  return filter.set.mock.calls.map(([value]) => value as string);
}

describe('SquigglyText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    filter.set.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('should cycle the wobble filters on a fixed cadence', () => {
    setReducedMotion(false);
    renderSquiggly({ steps: 3, stepDuration: 80 });

    vi.advanceTimersByTime(80 * 4);

    const filters = appliedFilters();
    expect(filters).toHaveLength(4);
    expect(filters[0]).toMatch(/^url\(#squiggly-.+-0\)$/);
    expect(filters[1]).toMatch(/-1\)$/);
    expect(filters[2]).toMatch(/-2\)$/);
    expect(filters[3]).toMatch(/-0\)$/);
  });

  it('should settle into plain text once the duration has passed', () => {
    setReducedMotion(false);
    renderSquiggly({ duration: 400, stepDuration: 80 });

    vi.advanceTimersByTime(400);
    expect(appliedFilters().at(-1)).toBe('none');

    const callsWhenSettled = filter.set.mock.calls.length;
    vi.advanceTimersByTime(2000);
    expect(filter.set).toHaveBeenCalledTimes(callsWhenSettled);
  });

  it('should never start the wobble when the user prefers reduced motion', () => {
    setReducedMotion(true);
    renderSquiggly();

    vi.advanceTimersByTime(5000);

    expect(filter.set).not.toHaveBeenCalled();
  });

  it('should render the same markup whether or not reduced motion is preferred', () => {
    setReducedMotion(false);
    const animated = renderSquiggly().container.innerHTML;
    cleanup();

    setReducedMotion(true);
    const reduced = renderSquiggly().container.innerHTML;

    // `useId` differs between the two renders; everything else must match so hydration is stable.
    const withoutIds = (html: string) => html.replace(/squiggly-[^"-]+-/g, 'squiggly-');
    expect(withoutIds(reduced)).toBe(withoutIds(animated));
    expect(reduced).toContain('<filter');
  });

  it('should stop the wobble when it unmounts', () => {
    setReducedMotion(false);
    const { unmount } = renderSquiggly();

    vi.advanceTimersByTime(160);
    unmount();
    const callsAfterUnmount = filter.set.mock.calls.length;
    vi.advanceTimersByTime(1000);

    expect(appliedFilters().at(-1)).toBe('none');
    expect(filter.set).toHaveBeenCalledTimes(callsAfterUnmount);
  });
});
