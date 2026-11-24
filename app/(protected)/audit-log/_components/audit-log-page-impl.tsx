'use client';

import { useEffect } from 'react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { CiCircleAlert, CiCircleRemove } from 'react-icons/ci';
import { PiClipboardTextDuotone, PiLockKeyDuotone, PiMagnifyingGlassDuotone } from 'react-icons/pi';

import { ApiError, getApiErrorMessage } from '@/app/queries/api-error';
import { useAuditEventsQuery } from '@/app/queries/audit-log/useAuditEvents';
import { useExportAuditLog } from '@/app/queries/audit-log/useExportAuditLog';
import {
  useCurrentUserQuery,
  useHasPermission,
} from '@/app/queries/identity-access/useCurrentUser';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AUDIT_LOG_PAGE_SIZE,
  countActiveFilters,
  patientName,
  resolveFilters,
  toAuditEventsParams,
} from '../_utils/audit-log-filters';
import { AuditEventSheet } from './_sheets/audit-event-sheet';
import { AuditExportMenu } from './audit-export-menu';
import { AuditLogFilterForm, type EditableAuditLogFilters } from './audit-log-filter-form';
import { AuditLogTable, AuditLogTableSkeleton } from './audit-log-table';

const urlParsers = {
  q: parseAsString,
  to: parseAsString,
  from: parseAsString,
  page: parseAsInteger,
  visit: parseAsString,
  event: parseAsInteger,
  actor: parseAsString,
  module: parseAsString,
  patient: parseAsString,
  session: parseAsString,
  operation: parseAsString,
};

const CLEARED_PARAMS = {
  q: null,
  to: null,
  from: null,
  page: null,
  visit: null,
  event: null,
  actor: null,
  module: null,
  patient: null,
  session: null,
  operation: null,
};

function ScopeChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 py-1 pr-1 pl-2.5">
      {label}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-5"
        aria-label={`Clear ${label}`}
        onClick={onClear}
      >
        <CiCircleRemove className="size-4" />
      </Button>
    </Badge>
  );
}

export function AuditLogPageImpl() {
  const { data: currentUser } = useCurrentUserQuery();
  const { data: canExport } = useHasPermission('audit-log:export');
  const timeZone = currentUser?.tenant.timeZone;
  const [params, setParams] = useQueryStates(urlParsers, { history: 'push' });

  const filters = resolveFilters(params);
  const activeCount = countActiveFilters(filters);
  // Guard against invalid URL values (?page=0, ?page=-1) reaching the query.
  const page = params.page !== null && params.page > 0 ? params.page : 1;
  const apiParams = toAuditEventsParams(filters);

  const eventsQuery = useAuditEventsQuery({ ...apiParams, page, limit: AUDIT_LOG_PAGE_SIZE });
  const exportMutation = useExportAuditLog();

  const events = eventsQuery.data?.data ?? [];
  const total = eventsQuery.data?.meta.total ?? 0;
  const totalPages = eventsQuery.data?.meta.totalPages ?? 0;
  // The sheet resolves its event from the page already loaded (ADR 0010).
  const openEvent = events.find((event) => event.id === params.event) ?? null;
  const scopedPatient = filters.patientId
    ? events.find((event) => event.patient?.id === Number(filters.patientId))
    : undefined;
  const scopedActor = filters.actorUserId
    ? events.find((event) => event.actorUserId === filters.actorUserId)
    : undefined;
  const isForbidden = eventsQuery.error instanceof ApiError && eventsQuery.error.status === 403;

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

  // An ?event= that is not on the loaded page (a stale link, or the event moved
  // to another page) opens nothing, so drop it rather than leave it in the URL.
  useEffect(() => {
    if (params.event !== null && eventsQuery.isSuccess && !openEvent) {
      void setParams({ event: null }, { history: 'replace' });
    }
  }, [params.event, eventsQuery.isSuccess, openEvent, setParams]);

  function applyFilters(next: EditableAuditLogFilters) {
    void setParams({
      q: next.query || null,
      to: next.to,
      from: next.from,
      page: null,
      event: null,
      module: next.module,
      operation: next.operation,
    });
  }

  if (isForbidden) {
    return (
      <EmptyState
        tone="danger"
        orbit={false}
        icon={PiLockKeyDuotone}
        className="bg-card min-h-72 border"
        title="You do not have access to the Audit Log"
        description="Ask a Tenant Admin for the Audit Log permission."
      />
    );
  }

  return (
    <div className="space-y-4">
      <AuditLogFilterForm
        applied={filters}
        activeCount={activeCount}
        onApply={applyFilters}
        onReset={() => void setParams(CLEARED_PARAMS)}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">Audit Events</h2>
          {filters.patientId ? (
            <ScopeChip
              label={
                scopedPatient?.patient
                  ? `Patient ${patientName(scopedPatient)} · ${scopedPatient.patient.mrn}`
                  : `Patient #${filters.patientId}`
              }
              onClear={() => void setParams({ patient: null, page: null, event: null })}
            />
          ) : null}
          {filters.actorUserId ? (
            <ScopeChip
              label={scopedActor ? `User ${scopedActor.actorName}` : 'One user'}
              onClear={() => void setParams({ actor: null, page: null, event: null })}
            />
          ) : null}
          {filters.sessionId ? (
            <ScopeChip
              label={`Session …${filters.sessionId.slice(-6)}`}
              onClear={() => void setParams({ session: null, page: null, event: null })}
            />
          ) : null}
          {filters.visitId ? (
            <ScopeChip
              label={`Visit #${filters.visitId}`}
              onClear={() => void setParams({ visit: null, page: null, event: null })}
            />
          ) : null}
        </div>
        {canExport ? (
          <AuditExportMenu
            countNoun="event"
            analyticsExport="audit_events"
            disabled={total === 0}
            pendingFormat={exportMutation.isPending ? exportMutation.variables?.format : undefined}
            onExport={(format) => exportMutation.mutateAsync({ format, filters: apiParams })}
          />
        ) : null}
      </div>

      {eventsQuery.isError ? (
        <Alert variant="destructive">
          <CiCircleAlert className="size-4" />
          <AlertTitle>Could not load the Audit Events</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {getApiErrorMessage(eventsQuery.error)}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void eventsQuery.refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <SkeletonCrossfade isLoading={eventsQuery.isLoading} skeleton={<AuditLogTableSkeleton />}>
          {events.length === 0 ? (
            activeCount > 0 ? (
              <EmptyState
                tone="neutral"
                icon={PiMagnifyingGlassDuotone}
                title="No Audit Events match these filters"
                className="bg-card min-h-72 border"
                description="Widen the date range, clear the search, or choose a different Module or Operation."
                actions={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void setParams(CLEARED_PARAMS)}
                  >
                    Reset filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                tone="teal"
                icon={PiClipboardTextDuotone}
                title="No Audit Events yet"
                className="bg-card min-h-72 border"
                description="Events appear here as staff open and change Patients, Visits and other records."
              />
            )
          ) : (
            <AuditLogTable
              events={events}
              total={total}
              page={page}
              timeZone={timeZone}
              totalPages={totalPages}
              isFetching={eventsQuery.isFetching}
              onOpen={(event) => void setParams({ event: event.id })}
              onPageChange={(next) => void setParams({ page: next > 1 ? next : null, event: null })}
            />
          )}
        </SkeletonCrossfade>
      )}

      <AuditEventSheet
        event={openEvent}
        timeZone={timeZone}
        onClose={() => void setParams({ event: null })}
      />
    </div>
  );
}
