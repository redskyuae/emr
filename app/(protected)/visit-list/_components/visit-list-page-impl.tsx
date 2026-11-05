'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { parseAsString, useQueryStates } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { ChevronLeft, ChevronRight, ClipboardList, Plus } from 'lucide-react';

import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { DemoDataBanner } from '@/components/app/demo-data-banner';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { VISIT_STATUS_FILTERS } from '../../visits/_utils/visit-status';
import { staticVisitList } from '../_data/static-visit-list';
import {
  BILLING_OPTIONS,
  PATIENT_TYPE_OPTIONS,
  SOURCE_OPTIONS,
  countActiveFilters,
  filterVisits,
  summarizeVisits,
  type VisitListFilters,
} from '../_utils/visit-list-filters';
import { VisitListFiltersBar } from './visit-list-filters-bar';
import { VisitListSummary } from './visit-list-summary';
import { VisitListTable } from './visit-list-table';

const PAGE_SIZE = 10;

const filterParsers = {
  to: parseAsString,
  from: parseAsString,
  type: parseAsString,
  doctor: parseAsString,
  status: parseAsString,
  source: parseAsString,
  billing: parseAsString,
  patientType: parseAsString,
};

function pickOption<T extends string>(
  options: ReadonlyArray<{ value: T }>,
  value: string | null
): T | null {
  return options.find((option) => option.value === value)?.value ?? null;
}

export function VisitListPageImpl() {
  const [today] = useState(() => new Date());
  const [params, setParams] = useQueryStates(filterParsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const { data: canCreate } = useHasPermission('visit:create');

  const filters: VisitListFilters = {
    to: params.to,
    from: params.from,
    type: params.type,
    doctor: params.doctor,
    query: debouncedSearch,
    status: pickOption(VISIT_STATUS_FILTERS, params.status),
    source: pickOption(SOURCE_OPTIONS, params.source),
    billing: pickOption(BILLING_OPTIONS, params.billing),
    patientType: pickOption(PATIENT_TYPE_OPTIONS, params.patientType),
  };

  // Tiles summarise the date/doctor/search scope, so a status tile can still
  // show how many Visits each other status holds.
  const scopedRows = useMemo(
    () => filterVisits(staticVisitList, { ...filters, status: null }, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, debouncedSearch, today]
  );
  const rows = useMemo(
    () => scopedRows.filter((row) => !filters.status || row.status === filters.status),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopedRows, params.status]
  );
  const summary = useMemo(() => summarizeVisits(scopedRows), [scopedRows]);

  const activeCount = countActiveFilters(filters);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = rows.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, rows.length);

  function changeFilters(patch: Omit<Partial<VisitListFilters>, 'query'>) {
    setPage(1);
    void setParams(patch);
  }

  function clearFilters() {
    setPage(1);
    setSearchTerm('');
    void setParams(null);
  }

  return (
    <div className="space-y-4">
      <DemoDataBanner />

      <VisitListSummary
        summary={summary}
        activeStatus={filters.status as VisitStatus | null}
        onStatusChange={(status) => changeFilters({ status })}
      />

      <VisitListFiltersBar
        today={today}
        filters={filters}
        searchTerm={searchTerm}
        activeCount={activeCount}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        onFilterChange={changeFilters}
        onClear={clearFilters}
      />

      {rows.length === 0 ? (
        <Empty className="bg-card shadow-fluent-2 min-h-72 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList />
            </EmptyMedia>
            <EmptyTitle>No Visits match these filters</EmptyTitle>
            <EmptyDescription>
              Widen the date range or clear a filter to see more of this Tenant&apos;s Visits.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
            {canCreate ? (
              <Button asChild>
                <Link href="/visits/new">
                  <Plus className="size-4" />
                  Create Visit
                </Link>
              </Button>
            ) : null}
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <VisitListTable rows={pageRows} today={today} />

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-muted-foreground text-sm">
              Showing {rangeStart}&ndash;{rangeEnd} of {rows.length}
            </p>
            {totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
