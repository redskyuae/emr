'use client';

import { useEffect, useState } from 'react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { toast } from 'sonner';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { VisitStatusCategory } from '@/app/api/lib/modules/visit-status/schemas/visit-status-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useCompleteVisit } from '@/app/queries/visits/useCompleteVisit';
import { useStartVisit } from '@/app/queries/visits/useStartVisit';
import { useVisitsQuery } from '@/app/queries/visits/useVisits';
import { CancelVisitDialog } from './_modals/cancel-visit-dialog';
import { DeleteVisitDialog } from './_modals/delete-visit-dialog';
import { VisitQueueBoard } from './visit-queue-board';
import { VisitsTable } from './visits-table';
import { VisitsToolbar } from './visits-toolbar';

const PAGE_SIZE = 10;
const VALID_CATEGORIES: VisitStatusCategory[] = ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export function VisitsPageImpl() {
  const [search, setSearch] = useQueryState('q', { defaultValue: '' });
  const [statusParam, setStatusParam] = useQueryState('status', { defaultValue: '' });
  const [doctorParam, setDoctorParam] = useQueryState('doctorId', { defaultValue: '' });
  const [viewParam, setViewParam] = useQueryState('view', { defaultValue: 'table' });
  const [pageParam, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  const [visitPendingCancel, setVisitPendingCancel] = useState<Visit | null>(null);
  const [visitPendingDelete, setVisitPendingDelete] = useState<Visit | null>(null);

  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const statusCategory = VALID_CATEGORIES.includes(statusParam as VisitStatusCategory)
    ? (statusParam as VisitStatusCategory)
    : undefined;
  const doctorId = /^\d+$/.test(doctorParam) ? Number(doctorParam) : undefined;
  const view = viewParam === 'queue' ? 'queue' : 'table';

  const startMutation = useStartVisit();
  const completeMutation = useCompleteVisit();

  const visitsQuery = useVisitsQuery({
    page,
    limit: PAGE_SIZE,
    query: search.trim() ? search.trim() : undefined,
    statusCategory,
    doctorId,
  });

  const visits = visitsQuery.data?.data ?? [];
  const meta = visitsQuery.data?.meta;

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

  async function handleStart(visit: Visit) {
    try {
      await startMutation.mutateAsync({ id: visit.id });
      toast.success(`${visit.visitNumber} started.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleComplete(visit: Visit) {
    try {
      await completeMutation.mutateAsync({ id: visit.id });
      toast.success(`${visit.visitNumber} completed.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-4">
      <VisitsToolbar
        search={search}
        onSearchChange={(value) => {
          void setSearch(value || null);
          goToFirstPage();
        }}
        statusCategory={statusParam}
        onStatusCategoryChange={(value) => {
          void setStatusParam(value || null);
          goToFirstPage();
        }}
        doctorId={doctorParam}
        onDoctorIdChange={(value) => {
          void setDoctorParam(value || null);
          goToFirstPage();
        }}
        view={view}
        onViewChange={(next) => void setViewParam(next === 'table' ? null : next)}
      />

      {view === 'queue' ? (
        <VisitQueueBoard
          doctorId={doctorId}
          onStart={(visit) => void handleStart(visit)}
          onComplete={(visit) => void handleComplete(visit)}
          onCancel={setVisitPendingCancel}
        />
      ) : (
        <VisitsTable
          visits={visits}
          meta={meta}
          isLoading={visitsQuery.isLoading}
          isFetching={visitsQuery.isFetching}
          isError={visitsQuery.isError}
          error={visitsQuery.error}
          page={page}
          onPageChange={(next) => void setPage(next)}
          onStart={(visit) => void handleStart(visit)}
          onComplete={(visit) => void handleComplete(visit)}
          onCancel={setVisitPendingCancel}
          onDelete={setVisitPendingDelete}
        />
      )}

      <CancelVisitDialog visit={visitPendingCancel} onClose={() => setVisitPendingCancel(null)} />
      <DeleteVisitDialog visit={visitPendingDelete} onClose={() => setVisitPendingDelete(null)} />
    </div>
  );
}
