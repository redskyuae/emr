'use client';

import { useEffect, useRef } from 'react';

import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';

type SearchedList = AnalyticsEventProperties<'list_searched'>['list'];

type ListSearch = {
  /** The applied term: after the debounce, as the list query uses it. */
  term: string;
  /** The list query for `term`; the search has settled once it holds its own results. */
  query: { isSuccess: boolean; isFetching: boolean; isPlaceholderData: boolean };
  resultCount: number | undefined;
};

/**
 * Records `list_searched` once per settled search: the term's length and whether it found
 * anything, never the term. A term already in the address when the list opens (a shared link,
 * a refresh) is not a search the user made, so it is not counted.
 */
export function useListSearchAnalytics(list: SearchedList, search: ListSearch) {
  const term = search.term.trim();
  const lastTerm = useRef(term);
  const { query, resultCount } = search;
  const isSettled = query.isSuccess && !query.isFetching && !query.isPlaceholderData;

  useEffect(() => {
    if (!term) {
      lastTerm.current = '';
      return;
    }

    if (!isSettled || resultCount === undefined || term === lastTerm.current) {
      return;
    }

    lastTerm.current = term;
    captureAnalyticsEvent('list_searched', {
      list,
      query_length: term.length,
      has_results: resultCount > 0,
    });
  }, [list, term, isSettled, resultCount]);
}
