'use client';

import { useEffect } from 'react';
import { parseAsInteger, useQueryState } from 'nuqs';

import { usePatientsQuery } from '@/app/queries/patients/usePatients';

import { PatientsTable } from './patients-table';
import { PatientsToolbar } from './patients-toolbar';

const PAGE_SIZE = 10;

export function PatientsPageImpl() {
  const [search, setSearch] = useQueryState('q', { defaultValue: '' });
  const [genderParam, setGenderParam] = useQueryState('gender', { defaultValue: '' });
  const [statusParam, setStatusParam] = useQueryState('status', { defaultValue: '' });
  const [pageParam, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  // Guard against invalid URL values (?page=0, ?page=-1) reaching the query.
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const gender =
    genderParam === 'male' ||
    genderParam === 'female' ||
    genderParam === 'other' ||
    genderParam === 'unknown'
      ? genderParam
      : undefined;
  const isActive = statusParam === 'active' ? true : statusParam === 'inactive' ? false : undefined;

  const patientsQuery = usePatientsQuery({
    page,
    limit: PAGE_SIZE,
    query: search.trim() ? search.trim() : undefined,
    gender,
    isActive,
  });

  const patients = patientsQuery.data?.data ?? [];
  const meta = patientsQuery.data?.meta;

  // Re-sync the URL when the requested page is invalid or now out of range (e.g. a
  // filter change shrank the result set past the current page), so the table
  // doesn't get stuck on an empty page with pagination hidden.
  useEffect(() => {
    if (pageParam !== page) {
      void setPage(page);
      return;
    }

    if (meta?.totalPages && page > meta.totalPages) {
      void setPage(meta.totalPages);
    }
  }, [meta?.totalPages, page, pageParam, setPage]);

  function goToFirstPage() {
    void setPage(1);
  }

  return (
    <div className="space-y-4">
      <PatientsToolbar
        search={search}
        onSearchChange={(value) => {
          void setSearch(value || null);
          goToFirstPage();
        }}
        genderValue={genderParam}
        onGenderChange={(value) => {
          void setGenderParam(value || null);
          goToFirstPage();
        }}
        statusValue={statusParam}
        onStatusChange={(value) => {
          void setStatusParam(value || null);
          goToFirstPage();
        }}
      />

      <PatientsTable
        patients={patients}
        meta={meta}
        isLoading={patientsQuery.isLoading}
        isFetching={patientsQuery.isFetching}
        isError={patientsQuery.isError}
        error={patientsQuery.error}
        page={page}
        onPageChange={(next) => void setPage(next)}
      />
    </div>
  );
}
