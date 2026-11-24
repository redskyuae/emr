'use client';

import { useEffect, useState } from 'react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { CiCircleAlert } from 'react-icons/ci';
import { PiLockKeyDuotone, PiMagnifyingGlassDuotone, PiUsersThreeDuotone } from 'react-icons/pi';

import { ApiError, getApiErrorMessage } from '@/app/queries/api-error';
import { useUserAuditListQuery } from '@/app/queries/audit-log/useUserAudit';
import { useExportUserAudit } from '@/app/queries/audit-log/useExportUserAudit';
import {
  useCurrentUserQuery,
  useHasPermission,
} from '@/app/queries/identity-access/useCurrentUser';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AuditExportMenu } from '../../_components/audit-export-menu';
import { AUDIT_LOG_PAGE_SIZE } from '../../_utils/audit-log-filters';
import type { UserAuditFilterFormValues } from '../_utils/user-audit-filter-form-schema';
import {
  isDefaultUserAuditRange,
  resolveUserAuditRange,
  tenantTodayIso,
  userAuditRangeLabel,
} from '../_utils/user-audit-range';
import { UserAuditFilterForm } from './user-audit-filter-form';
import { UserAuditTable, UserAuditTableSkeleton } from './user-audit-table';

const urlParsers = {
  q: parseAsString,
  to: parseAsString,
  from: parseAsString,
  page: parseAsInteger,
};

const CLEARED_PARAMS = { q: null, to: null, from: null, page: null };

export function UserAuditListImpl() {
  const [now] = useState(() => new Date());
  const { data: currentUser } = useCurrentUserQuery();
  const { data: canExport } = useHasPermission('audit-log:export');
  const exportMutation = useExportUserAudit();
  const timeZone = currentUser?.tenant.timeZone;
  const todayIso = tenantTodayIso(now, timeZone);
  const [params, setParams] = useQueryStates(urlParsers, { history: 'push' });

  const range = resolveUserAuditRange(params, todayIso);
  const query = params.q?.trim() ?? '';
  const activeCount = [!isDefaultUserAuditRange(range, todayIso), query !== ''].filter(
    Boolean
  ).length;
  // Guard against invalid URL values (?page=0, ?page=-1) reaching the query.
  const page = params.page !== null && params.page > 0 ? params.page : 1;

  const usersQuery = useUserAuditListQuery({
    fromDate: range.from,
    toDate: range.to,
    query: query || undefined,
    page,
    limit: AUDIT_LOG_PAGE_SIZE,
  });

  const users = usersQuery.data?.data ?? [];
  const total = usersQuery.data?.meta.total ?? 0;
  const totalPages = usersQuery.data?.meta.totalPages ?? 0;
  const isForbidden = usersQuery.error instanceof ApiError && usersQuery.error.status === 403;
  const rangeQuery = isDefaultUserAuditRange(range, todayIso)
    ? ''
    : `?from=${range.from}&to=${range.to}`;

  // Re-sync the URL when the requested page is invalid or now out of range.
  useEffect(() => {
    if (params.page !== null && params.page !== page) {
      void setParams({ page: null }, { history: 'replace' });
      return;
    }

    if (totalPages && page > totalPages) {
      void setParams({ page: totalPages > 1 ? totalPages : null }, { history: 'replace' });
    }
  }, [page, params.page, setParams, totalPages]);

  function applyFilters(values: UserAuditFilterFormValues) {
    void setParams({ q: values.query || null, from: values.from, to: values.to, page: null });
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
      <UserAuditFilterForm
        applied={{ from: range.from, to: range.to, query }}
        activeCount={activeCount}
        onApply={applyFilters}
        onReset={() => void setParams(CLEARED_PARAMS)}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-base font-semibold">Users</h2>
          <p className="text-muted-foreground text-sm">Counts cover {userAuditRangeLabel(range)}</p>
        </div>
        {canExport ? (
          <AuditExportMenu
            countNoun="user"
            analyticsExport="user_audit_list"
            disabled={total === 0}
            pendingFormat={exportMutation.isPending ? exportMutation.variables?.format : undefined}
            onExport={(format) =>
              exportMutation.mutateAsync({
                format,
                filters: { fromDate: range.from, toDate: range.to, query: query || undefined },
              })
            }
          />
        ) : null}
      </div>

      {usersQuery.isError ? (
        <Alert variant="destructive">
          <CiCircleAlert className="size-4" />
          <AlertTitle>Could not load User Audit Events</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {getApiErrorMessage(usersQuery.error)}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void usersQuery.refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <SkeletonCrossfade isLoading={usersQuery.isLoading} skeleton={<UserAuditTableSkeleton />}>
          {users.length === 0 ? (
            query ? (
              <EmptyState
                tone="neutral"
                icon={PiMagnifyingGlassDuotone}
                title="No users match this search"
                className="bg-card min-h-72 border"
                description="Try a different name, email or staff code."
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
                tone="violet"
                icon={PiUsersThreeDuotone}
                title="No users yet"
                className="bg-card min-h-72 border"
                description="Staff appear here once they are added to this Tenant."
              />
            )
          ) : (
            <UserAuditTable
              users={users}
              total={total}
              page={page}
              timeZone={timeZone}
              totalPages={totalPages}
              rangeQuery={rangeQuery}
              isFetching={usersQuery.isFetching}
              onPageChange={(next) => void setParams({ page: next > 1 ? next : null })}
            />
          )}
        </SkeletonCrossfade>
      )}
    </div>
  );
}
