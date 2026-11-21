// @vitest-environment jsdom

import { StrictMode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useWorkflowAnalytics } from './use-workflow-analytics';

function renderWorkflow(initialReady = true) {
  const onStart = vi.fn();
  const onAbandon = vi.fn();
  const view = renderHook(
    ({ ready }: { ready: boolean }) => useWorkflowAnalytics({ ready, onStart, onAbandon }),
    { initialProps: { ready: initialReady }, wrapper: StrictMode }
  );

  return { ...view, onStart, onAbandon };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-21T09:00:00Z'));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useWorkflowAnalytics', () => {
  it('should start once and not abandon when strict mode remounts the screen', () => {
    const { onStart, onAbandon } = renderWorkflow();

    act(() => vi.runAllTimers());

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onAbandon).not.toHaveBeenCalled();
  });

  it('should abandon exactly once on unmount with the seconds since the start', () => {
    const { unmount, onAbandon } = renderWorkflow();

    vi.advanceTimersByTime(42_400);
    unmount();
    act(() => vi.runAllTimers());

    expect(onAbandon).toHaveBeenCalledTimes(1);
    expect(onAbandon).toHaveBeenCalledWith({ secondsSinceStarted: 42, options: undefined });
  });

  it('should abandon by beacon when the page hides, and not again on unmount', () => {
    const { unmount, onAbandon } = renderWorkflow();

    vi.advanceTimersByTime(5_000);
    window.dispatchEvent(new Event('pagehide'));
    unmount();
    act(() => vi.runAllTimers());

    expect(onAbandon).toHaveBeenCalledTimes(1);
    expect(onAbandon).toHaveBeenCalledWith({
      secondsSinceStarted: 5,
      options: { transport: 'sendBeacon' },
    });
  });

  it('should not abandon after the workflow succeeded', () => {
    const { result, unmount, onAbandon } = renderWorkflow();

    result.current.markSucceeded();
    window.dispatchEvent(new Event('pagehide'));
    unmount();
    act(() => vi.runAllTimers());

    expect(onAbandon).not.toHaveBeenCalled();
  });

  it('should wait until the screen is ready to start', () => {
    const { rerender, result, onStart } = renderWorkflow(false);

    expect(onStart).not.toHaveBeenCalled();
    expect(result.current.secondsSinceStarted()).toBe(0);

    vi.advanceTimersByTime(3_000);
    rerender({ ready: true });
    vi.advanceTimersByTime(7_000);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(result.current.secondsSinceStarted()).toBe(7);
  });

  it('should not abandon a screen that never started', () => {
    const { unmount, onAbandon } = renderWorkflow(false);

    unmount();
    act(() => vi.runAllTimers());

    expect(onAbandon).not.toHaveBeenCalled();
  });
});
