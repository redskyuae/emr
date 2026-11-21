// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/app/queries/api-error';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import { useInvoiceComposerAnalytics } from './use-invoice-composer-analytics';

vi.mock('@/lib/analytics/analytics-client', () => ({ captureAnalyticsEvent: vi.fn() }));

function renderComposer(currentLink: 'visit' | 'admission' | 'none' = 'visit') {
  return renderHook(() =>
    useInvoiceComposerAnalytics({ openedFor: 'visit', currentLink: () => currentLink })
  );
}

describe('useInvoiceComposerAnalytics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(captureAnalyticsEvent).mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('should record what the composer was opened for', () => {
    renderComposer();

    expect(captureAnalyticsEvent).toHaveBeenCalledWith('invoice_composer_started', {
      linked_to: 'visit',
    });
  });

  it('should record a failure after the Invoice was created with its step and status only', () => {
    const { result } = renderComposer();

    act(() =>
      result.current.recordStepFailed(
        'record_payment',
        new ApiError('Payment of 500.00 exceeds the balance due.', undefined, 409)
      )
    );

    expect(captureAnalyticsEvent).toHaveBeenLastCalledWith('invoice_composer_step_failed', {
      failed_step: 'record_payment',
      status: 409,
    });
  });

  it('should record the submission counts and flags with the time spent', () => {
    const { result } = renderComposer();

    vi.advanceTimersByTime(90_000);
    act(() =>
      result.current.recordSubmitted({
        linked_to: 'visit',
        line_count: 3,
        tender_count: 2,
        finalize_now: true,
        has_discount: false,
      })
    );

    expect(captureAnalyticsEvent).toHaveBeenLastCalledWith('invoice_composer_submitted', {
      linked_to: 'visit',
      line_count: 3,
      tender_count: 2,
      finalize_now: true,
      has_discount: false,
      seconds_since_started: 90,
    });
  });

  it('should record leaving before completion as abandoned, with the encounter chosen then', () => {
    const { unmount } = renderComposer('none');

    unmount();
    act(() => vi.runAllTimers());

    expect(captureAnalyticsEvent).toHaveBeenLastCalledWith('invoice_composer_abandoned', {
      linked_to: 'none',
      seconds_since_started: 0,
    });
  });

  it('should not record abandoned after every step succeeded', () => {
    const { result, unmount } = renderComposer();

    act(() => result.current.recordCompleted());
    unmount();
    act(() => vi.runAllTimers());

    expect(captureAnalyticsEvent).not.toHaveBeenCalledWith(
      'invoice_composer_abandoned',
      expect.anything()
    );
  });
});
