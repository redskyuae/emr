// @vitest-environment jsdom

import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import { useListSearchAnalytics } from './use-list-search-analytics';

vi.mock('@/lib/analytics/analytics-client', () => ({ captureAnalyticsEvent: vi.fn() }));

type Search = { term: string; isSettled: boolean; resultCount: number | undefined };

function renderSearch(initial: Search) {
  return renderHook(
    ({ term, isSettled, resultCount }: Search) =>
      useListSearchAnalytics('patients', {
        term,
        resultCount,
        query: { isSuccess: true, isFetching: !isSettled, isPlaceholderData: false },
      }),
    { initialProps: initial }
  );
}

describe('useListSearchAnalytics', () => {
  beforeEach(() => {
    vi.mocked(captureAnalyticsEvent).mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should record one search with the term length and no term once results settle', () => {
    const { rerender } = renderSearch({ term: '', isSettled: true, resultCount: 40 });

    rerender({ term: 'Asha Nair', isSettled: false, resultCount: 40 });
    expect(captureAnalyticsEvent).not.toHaveBeenCalled();

    rerender({ term: 'Asha Nair', isSettled: true, resultCount: 2 });
    rerender({ term: 'Asha Nair', isSettled: true, resultCount: 2 });

    expect(captureAnalyticsEvent).toHaveBeenCalledTimes(1);
    expect(captureAnalyticsEvent).toHaveBeenCalledWith('list_searched', {
      list: 'patients',
      query_length: 9,
      has_results: true,
    });
  });

  it('should report a search that found nothing', () => {
    const { rerender } = renderSearch({ term: '', isSettled: true, resultCount: 5 });

    rerender({ term: 'zzz', isSettled: true, resultCount: 0 });

    expect(captureAnalyticsEvent).toHaveBeenCalledWith('list_searched', {
      list: 'patients',
      query_length: 3,
      has_results: false,
    });
  });

  it('should wait while the list still shows the previous results', () => {
    const { rerender } = renderHook(
      ({ term, isPlaceholderData }: { term: string; isPlaceholderData: boolean }) =>
        useListSearchAnalytics('users', {
          term,
          resultCount: 12,
          query: { isSuccess: true, isFetching: false, isPlaceholderData },
        }),
      { initialProps: { term: '', isPlaceholderData: false } }
    );

    rerender({ term: 'nurse', isPlaceholderData: true });
    expect(captureAnalyticsEvent).not.toHaveBeenCalled();

    rerender({ term: 'nurse', isPlaceholderData: false });
    expect(captureAnalyticsEvent).toHaveBeenCalledTimes(1);
  });

  it('should not count a term that was already in the address when the list opened', () => {
    renderSearch({ term: 'Asha', isSettled: true, resultCount: 1 });

    expect(captureAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('should count the same term again after the search was cleared', () => {
    const { rerender } = renderSearch({ term: '', isSettled: true, resultCount: 5 });

    rerender({ term: 'Asha', isSettled: true, resultCount: 1 });
    rerender({ term: '', isSettled: true, resultCount: 5 });
    rerender({ term: 'Asha', isSettled: true, resultCount: 1 });

    expect(captureAnalyticsEvent).toHaveBeenCalledTimes(2);
  });
});
