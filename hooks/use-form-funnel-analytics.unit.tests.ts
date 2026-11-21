// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFormFunnelAnalytics } from './use-form-funnel-analytics';

function renderFunnel(active = true, reactStrictMode = false) {
  const onStarted = vi.fn();
  const onAbandoned = vi.fn();
  const view = renderHook(
    ({ isActive }: { isActive: boolean }) =>
      useFormFunnelAnalytics({ active: isActive, onStarted, onAbandoned }),
    { initialProps: { isActive: active }, reactStrictMode }
  );

  return { ...view, onStarted, onAbandoned };
}

describe('useFormFunnelAnalytics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('should start once and report abandonment with the seconds spent when the form closes', () => {
    const { unmount, onStarted, onAbandoned } = renderFunnel();

    expect(onStarted).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(42_400);
    unmount();
    act(() => vi.runAllTimers());

    expect(onAbandoned).toHaveBeenCalledExactlyOnceWith(42);
  });

  it('should not report abandonment after a successful save', () => {
    const { result, unmount, onAbandoned } = renderFunnel();

    act(() => result.current.finish());
    unmount();
    act(() => vi.runAllTimers());

    expect(onAbandoned).not.toHaveBeenCalled();
  });

  it('should wait until the form is shown before starting', () => {
    const { rerender, onStarted } = renderFunnel(false);

    expect(onStarted).not.toHaveBeenCalled();

    rerender({ isActive: true });

    expect(onStarted).toHaveBeenCalledTimes(1);
  });

  it('should report abandonment once when the tab is closed', () => {
    const { unmount, onAbandoned } = renderFunnel();

    window.dispatchEvent(new Event('pagehide'));
    unmount();
    act(() => vi.runAllTimers());

    expect(onAbandoned).toHaveBeenCalledTimes(1);
  });

  it('should not treat the development double mount as a start and an abandonment', () => {
    const { onStarted, onAbandoned } = renderFunnel(true, true);

    act(() => vi.runAllTimers());

    expect(onStarted).toHaveBeenCalledTimes(1);
    expect(onAbandoned).not.toHaveBeenCalled();
  });

  it('should report the seconds since the form started', () => {
    const { result } = renderFunnel();

    vi.advanceTimersByTime(7_600);

    expect(result.current.secondsSinceStarted()).toBe(8);
  });
});
