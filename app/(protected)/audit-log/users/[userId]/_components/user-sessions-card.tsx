'use client';

import Link from 'next/link';
import { PiClockCounterClockwiseDuotone } from 'react-icons/pi';

import type { UserAuditSession } from '@/app/api/lib/modules/audit-log/schemas/user-audit-schema';
import { EmptyState } from '@/components/app/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCount } from '@/lib/format-count';
import { sessionDuration } from '@/lib/session-duration';
import { formatAuditTime, splitAuditTime } from '../../../_utils/audit-log-filters';
import {
  auditLogHref,
  deviceColumns,
  rememberMeLabel,
  sessionStatusPresentation,
} from '../_utils/user-audit-detail';

const COLUMNS = [
  'Signed in',
  'Ended',
  'Status',
  'How it ended',
  'Duration',
  'Last activity',
  'Actions',
  'IP address',
  'Browser',
  'Operating system',
  'Device type',
  'Remember me',
] as const;

type SessionProps = { session: UserAuditSession; timeZone: string | undefined; now: Date };

function howItEnded({ session, timeZone }: Omit<SessionProps, 'now'>) {
  if (session.status === 'active') {
    return session.expiresAt
      ? `Still signed in, expires ${formatAuditTime(session.expiresAt, timeZone)}`
      : 'Still signed in';
  }

  return session.endReason ?? '—';
}

function StatusBadge({ session }: { session: UserAuditSession }) {
  const status = sessionStatusPresentation(session.status);
  return <Badge variant={status.variant}>{status.label}</Badge>;
}

function DateTime({ value, timeZone }: { value: Date | null; timeZone: string | undefined }) {
  if (!value) return <span className="text-muted-foreground">—</span>;

  const { date, time } = splitAuditTime(value, timeZone);

  return (
    <>
      <p className="font-medium">{date}</p>
      <p className="text-muted-foreground font-mono text-xs">{time}</p>
    </>
  );
}

function ActionsLink({ session }: { session: UserAuditSession }) {
  if (session.actionCount === 0) return <span className="text-muted-foreground">0</span>;

  return (
    <Link
      href={auditLogHref({ session: session.sessionId })}
      className="hover:text-primary font-medium hover:underline"
    >
      {session.actionCount}
    </Link>
  );
}

function UntrackedNote({ session }: { session: UserAuditSession }) {
  return session.signInRecorded ? null : (
    <p className="text-muted-foreground text-xs">Sign-in before tracking began</p>
  );
}

function SessionRow({ session, timeZone, now }: SessionProps) {
  const device = deviceColumns(session.userAgent);

  return (
    <TableRow className="align-top">
      <TableCell className="pl-4 whitespace-nowrap">
        <DateTime value={session.signedInAt} timeZone={timeZone} />
        <UntrackedNote session={session} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <DateTime value={session.endedAt} timeZone={timeZone} />
      </TableCell>
      <TableCell>
        <StatusBadge session={session} />
      </TableCell>
      <TableCell className="text-muted-foreground max-w-64 whitespace-normal">
        {howItEnded({ session, timeZone })}
      </TableCell>
      <TableCell className="whitespace-nowrap">{sessionDuration(session, now) ?? '—'}</TableCell>
      <TableCell className="whitespace-nowrap">
        <DateTime value={session.lastActivityAt} timeZone={timeZone} />
      </TableCell>
      <TableCell>
        <ActionsLink session={session} />
      </TableCell>
      <TableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap">
        {session.ipAddress ?? '—'}
      </TableCell>
      <TableCell className="whitespace-nowrap" title={session.userAgent ?? undefined}>
        {device.browser}
      </TableCell>
      <TableCell className="whitespace-nowrap">{device.os}</TableCell>
      <TableCell className="whitespace-nowrap">{device.deviceType}</TableCell>
      <TableCell className="pr-4">{rememberMeLabel(session.rememberMe)}</TableCell>
    </TableRow>
  );
}

function SessionCard({ session, timeZone, now }: SessionProps) {
  const device = deviceColumns(session.userAgent);

  return (
    <li className="space-y-2 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{formatAuditTime(session.signedInAt, timeZone)}</p>
          <p className="text-muted-foreground text-xs">
            {device.browser} · {device.os} · {device.deviceType}
          </p>
          <p className="text-muted-foreground font-mono text-xs">{session.ipAddress ?? '—'}</p>
          <UntrackedNote session={session} />
        </div>
        <StatusBadge session={session} />
      </div>
      <p className="text-muted-foreground text-xs">{howItEnded({ session, timeZone })}</p>
      <p className="text-xs">
        {sessionDuration(session, now) ?? 'Duration unknown'} · <ActionsLink session={session} />{' '}
        {session.actionCount === 1 ? 'action' : 'actions'}
      </p>
    </li>
  );
}

export function UserSessionsCard({
  sessions,
  truncated,
  timeZone,
  now,
}: {
  sessions: UserAuditSession[];
  truncated: boolean;
  timeZone: string | undefined;
  now: Date;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b p-4">
        <CardTitle>Sessions</CardTitle>
        <CardDescription>
          Each sign-in from start to end, with where it came from and what was done in it.
          {truncated ? ' Only the latest 100 Sessions in this range are shown.' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {sessions.length === 0 ? (
          <EmptyState
            size="md"
            tone="violet"
            icon={PiClockCounterClockwiseDuotone}
            title="No Sessions in this range"
            description="Sign-ins appear here once this user signs in."
          />
        ) : (
          <>
            <ul className="divide-y md:hidden" aria-label="Sessions">
              {sessions.map((session) => (
                <SessionCard
                  key={session.sessionId}
                  session={session}
                  timeZone={timeZone}
                  now={now}
                />
              ))}
            </ul>
            <div className="hidden md:block">
              <Table className="min-w-[1500px]">
                <TableHeader>
                  <TableRow>
                    {COLUMNS.map((column, index) => (
                      <TableHead
                        key={column}
                        className={
                          index === 0
                            ? 'pl-4 whitespace-nowrap'
                            : index === COLUMNS.length - 1
                              ? 'pr-4 whitespace-nowrap'
                              : 'whitespace-nowrap'
                        }
                      >
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <SessionRow
                      key={session.sessionId}
                      session={session}
                      timeZone={timeZone}
                      now={now}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-muted-foreground border-t p-3 text-sm">
              {formatCount(sessions.length, 'Session')}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function UserSessionsCardSkeleton() {
  return (
    <Card className="gap-0 py-0" aria-hidden="true">
      <CardHeader className="border-b p-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y md:hidden">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-32" />
            </li>
          ))}
        </ul>
        <div className="hidden md:block">
          <Table className="min-w-[1500px]">
            <TableHeader>
              <TableRow>
                {COLUMNS.map((column, index) => (
                  <TableHead key={column} className={index === 0 ? 'pl-4' : undefined}>
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }, (_, row) => (
                <TableRow key={row}>
                  {COLUMNS.map((column, index) => (
                    <TableCell key={column} className={index === 0 ? 'pl-4' : undefined}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="border-t p-3">
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
