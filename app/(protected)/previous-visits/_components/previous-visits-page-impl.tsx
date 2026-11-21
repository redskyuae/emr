'use client';

import { useEffect, useState } from 'react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { CiCircleAlert } from 'react-icons/ci';
import { PiClockCounterClockwiseLight } from 'react-icons/pi';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useCurrentUserQuery } from '@/app/queries/identity-access/useCurrentUser';
import { useVisitsQuery } from '@/app/queries/visits/useVisits';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { useListSearchAnalytics } from '@/hooks/use-list-search-analytics';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  PREVIOUS_VISITS_PAGE_SIZE,
  appliedFilterNames,
  countActiveFilters,
  rangeLabel,
  resolveFilters,
  tenantToday,
  toVisitsParams,
  type PreviousVisitsFilters,
} from '../_utils/previous-visits-filters';
import { PreviousVisitsFilterForm } from './previous-visits-filter-form';
import { PreviousVisitsTable, PreviousVisitsTableSkeleton } from './previous-visits-table';

const urlParsers = {
  q: parseAsString,
  to: parseAsString,
  from: parseAsString,
  type: parseAsString,
  page: parseAsInteger,
  doctor: parseAsString,
  status: parseAsString,
};

const CLEARED_PARAMS = {
  q: null,
  to: null,
  from: null,
  type: null,
  page: null,
  doctor: null,
  status: null,
};

export function PreviousVisitsPageImpl() {
  const [now] = useState(() => new Date());
  const { data: currentUser } = useCurrentUserQuery();
  const today = tenantToday(now, currentUser?.tenant.timeZone);
  const [params, setParams] = useQueryStates(urlParsers, { history: 'push' });

  const filters = resolveFilters(params, today);
  const activeCount = countActiveFilters(filters, today);
  // Guard against invalid URL values (?page=0, ?page=-1) reaching the query.
  const page = params.page !== null && params.page > 0 ? params.page : 1;

  const visitsQuery = useVisitsQuery({
    ...toVisitsParams(filters),
    page,
    limit: PREVIOUS_VISITS_PAGE_SIZE,
  });

  const visits = visitsQuery.data?.data ?? [];
  const total = visitsQuery.data?.meta.total ?? 0;
  const totalPages = visitsQuery.data?.meta.totalPages ?? 0;

  useListSearchAnalytics('previous_visits', {
    term: filters.query,
    query: visitsQuery,
    resultCount: visitsQuery.data?.meta.total,
  });

  // Re-sync the URL when the requested page is invalid or now out of range, so
  // the list never sticks on an empty page with pagination hidden.
  useEffect(() => {
    if (params.page !== null && params.page !== page) {
      void setParams({ page: null }, { history: 'replace' });
      return;
    }

    if (totalPages && page > totalPages) {
      void setParams({ page: totalPages > 1 ? totalPages : null }, { history: 'replace' });
    }
  }, [page, params.page, setParams, totalPages]);

  function applyFilters(next: PreviousVisitsFilters) {
    for (const filter of appliedFilterNames(filters, next)) {
      captureAnalyticsEvent('list_filtered', { list: 'previous_visits', filter });
    }

    void setParams({
      q: next.query || null,
      to: next.to,
      from: next.from,
      type: next.visitTypeId,
      page: null,
      doctor: next.doctorId,
      status: next.status,
    });
  }

  function resetFilters() {
    void setParams(CLEARED_PARAMS);
  }

  function goToPage(nextPage: number) {
    void setParams({ page: nextPage > 1 ? nextPage : null });
  }

  return (
    <div className="space-y-4">
      <PreviousVisitsFilterForm
        applied={filters}
        activeCount={activeCount}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Previous Visits</h2>
        <p className="text-muted-foreground text-sm">{rangeLabel(filters)}</p>
      </div>

      {visitsQuery.isError ? (
        <Alert variant="destructive">
          <CiCircleAlert className="size-4" />
          <AlertTitle>Could not load Visits</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {getApiErrorMessage(visitsQuery.error)}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void visitsQuery.refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <SkeletonCrossfade
          isLoading={visitsQuery.isLoading}
          skeleton={<PreviousVisitsTableSkeleton />}
        >
          {visits.length === 0 ? (
            <Empty className="bg-card min-h-72 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PiClockCounterClockwiseLight />
                </EmptyMedia>
                {activeCount > 0 ? (
                  <>
                    <EmptyTitle>No Visits match these filters</EmptyTitle>
                    <EmptyDescription>
                      Widen the date range, clear the search, or choose a different Doctor, status
                      or Visit Type.
                    </EmptyDescription>
                  </>
                ) : (
                  <>
                    <EmptyTitle>No past Visits yet</EmptyTitle>
                    <EmptyDescription>
                      Visits appear here once Patients have been checked in.
                    </EmptyDescription>
                  </>
                )}
              </EmptyHeader>
              {activeCount > 0 ? (
                <EmptyContent>
                  <Button type="button" variant="outline" onClick={resetFilters}>
                    Reset filters
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <PreviousVisitsTable
              visits={visits}
              total={total}
              page={page}
              totalPages={totalPages}
              isFetching={visitsQuery.isFetching}
              onPageChange={goToPage}
            />
          )}
        </SkeletonCrossfade>
      )}
    </div>
  );
}
