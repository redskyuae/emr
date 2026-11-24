'use client';

import { useState } from 'react';
import Link from 'next/link';
import { parseAsString, useQueryStates } from 'nuqs';
import { CiCircleAlert } from 'react-icons/ci';
import { PiArrowLeftLight, PiLockKeyDuotone, PiUserFocusDuotone } from 'react-icons/pi';

import { ApiError, getApiErrorMessage } from '@/app/queries/api-error';
import { useUserAuditQuery } from '@/app/queries/audit-log/useUserAudit';
import { useExportUserAudit } from '@/app/queries/audit-log/useExportUserAudit';
import {
  useCurrentUserQuery,
  useHasPermission,
} from '@/app/queries/identity-access/useCurrentUser';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  isDefaultUserAuditRange,
  resolveUserAuditRange,
  tenantTodayIso,
  userAuditRangeLabel,
  type UserAuditRange,
} from '../../_utils/user-audit-range';
import { AuditExportMenu } from '../../../_components/audit-export-menu';
import { ActivityByModuleCard } from './activity-by-module-card';
import { FailedSignInsCard } from './failed-sign-ins-card';
import { UserAuditHeader, UserAuditHeaderSkeleton } from './user-audit-header';
import { UserAuditRangeForm } from './user-audit-range-form';
import { UserAuditStats, UserAuditStatsSkeleton } from './user-audit-stats';
import { DevicesCard, IpAddressesCard } from './user-network-cards';
import { UserSessionsCard, UserSessionsCardSkeleton } from './user-sessions-card';

const urlParsers = { from: parseAsString, to: parseAsString };

function BackLink() {
  return (
    <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
      <Link href="/audit-log/users">
        <PiArrowLeftLight className="size-4" />
        User Audit Events
      </Link>
    </Button>
  );
}

/** The loaded page's shape below the range form, for the first load and the route loader. */
export function UserAuditDetailSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading the user’s audit">
      <UserAuditStatsSkeleton />
      <UserSessionsCardSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function UserAuditDetailImpl({ userId }: { userId: string }) {
  const [now] = useState(() => new Date());
  const { data: currentUser } = useCurrentUserQuery();
  const { data: canExport } = useHasPermission('audit-log:export');
  const exportMutation = useExportUserAudit();
  const timeZone = currentUser?.tenant.timeZone;
  const todayIso = tenantTodayIso(now, timeZone);
  const [params, setParams] = useQueryStates(urlParsers, { history: 'push' });
  const range = resolveUserAuditRange(params, todayIso);

  const auditQuery = useUserAuditQuery(userId, { fromDate: range.from, toDate: range.to });
  const detail = auditQuery.data;
  const status = auditQuery.error instanceof ApiError ? auditQuery.error.status : undefined;
  const displayTimeZone = detail?.timeZone ?? timeZone;

  function applyRange(next: UserAuditRange) {
    void setParams({ from: next.from, to: next.to });
  }

  if (status === 403) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState
          tone="danger"
          orbit={false}
          icon={PiLockKeyDuotone}
          className="bg-card min-h-72 border"
          title="You do not have access to the Audit Log"
          description="Ask a Tenant Admin for the Audit Log permission."
        />
      </div>
    );
  }

  if (status === 404) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState
          tone="danger"
          orbit={false}
          icon={PiUserFocusDuotone}
          className="bg-card min-h-72 border"
          title="User not found"
          description="This user is not a member of this Tenant."
          actions={
            <Button type="button" variant="outline" asChild>
              <Link href="/audit-log/users">Back to User Audit Events</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackLink />

      {detail ? (
        <UserAuditHeader user={detail.user} timeZone={displayTimeZone} />
      ) : auditQuery.isError ? null : (
        <UserAuditHeaderSkeleton />
      )}

      <UserAuditRangeForm
        applied={range}
        isDefault={isDefaultUserAuditRange(range, todayIso)}
        onApply={applyRange}
        onReset={() => void setParams({ from: null, to: null })}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">{userAuditRangeLabel(range)}</p>
        {canExport && detail ? (
          <AuditExportMenu
            countNoun="Session"
            analyticsExport="user_audit"
            disabled={false}
            pendingFormat={exportMutation.isPending ? exportMutation.variables?.format : undefined}
            onExport={(format) =>
              exportMutation.mutateAsync({
                format,
                userId,
                filters: { fromDate: range.from, toDate: range.to },
              })
            }
          />
        ) : null}
      </div>

      {auditQuery.isError ? (
        <Alert variant="destructive">
          <CiCircleAlert className="size-4" />
          <AlertTitle>Could not load this user’s audit</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {getApiErrorMessage(auditQuery.error)}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void auditQuery.refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <SkeletonCrossfade isLoading={auditQuery.isLoading} skeleton={<UserAuditDetailSkeleton />}>
          {detail ? (
            <div className="space-y-4">
              <UserAuditStats summary={detail.summary} timeZone={displayTimeZone} />
              <UserSessionsCard
                sessions={detail.sessions}
                truncated={detail.sessionsTruncated}
                timeZone={displayTimeZone}
                now={now}
              />
              <FailedSignInsCard attempts={detail.failedSignIns} timeZone={displayTimeZone} />
              <div className="grid gap-4 lg:grid-cols-2">
                <IpAddressesCard ipAddresses={detail.ipAddresses} timeZone={displayTimeZone} />
                <DevicesCard devices={detail.devices} timeZone={displayTimeZone} />
              </div>
              <ActivityByModuleCard
                userId={userId}
                range={range}
                activity={detail.activityByModule}
              />
            </div>
          ) : null}
        </SkeletonCrossfade>
      )}
    </div>
  );
}
