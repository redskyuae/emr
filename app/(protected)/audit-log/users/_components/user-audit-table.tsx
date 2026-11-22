'use client';

import Link from 'next/link';
import { CiRead } from 'react-icons/ci';

import type { UserAuditListItem } from '@/app/api/lib/modules/audit-log/schemas/user-audit-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { describeUserAgent } from '@/lib/user-agent';
import { cn } from '@/lib/utils';
import { AUDIT_LOG_PAGE_SIZE, splitAuditTime } from '../../_utils/audit-log-filters';

const COLUMNS = [
  'User',
  'Roles',
  'Status',
  'Last sign-in',
  'Last activity',
  'Sign-ins',
  'Failed sign-ins',
  'Active Sessions',
  'Actions',
] as const;

const TABLE_MIN_WIDTH = 'min-w-[1280px]';

type TimeZoneProp = { timeZone: string | undefined };

function userHref(user: UserAuditListItem, rangeQuery: string) {
  return `/audit-log/users/${encodeURIComponent(user.userId)}${rangeQuery}`;
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge variant="secondary">Active</Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Deactivated
    </Badge>
  );
}

function When({ value, timeZone }: { value: Date | string | null } & TimeZoneProp) {
  if (!value) return <span className="text-muted-foreground">Never</span>;

  const when = splitAuditTime(value, timeZone);

  return (
    <>
      <p className="font-medium whitespace-nowrap">{when.date}</p>
      <p className="text-muted-foreground font-mono text-xs">{when.time}</p>
    </>
  );
}

function FailedCount({ count }: { count: number }) {
  return (
    <span
      className={cn(
        'tabular-nums',
        count > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'
      )}
    >
      {count}
    </span>
  );
}

function UserCards({
  users,
  timeZone,
  rangeQuery,
}: TimeZoneProp & { users: UserAuditListItem[]; rangeQuery: string }) {
  return (
    <ul className="divide-y md:hidden" aria-label="Users">
      {users.map((user) => (
        <li key={user.userId} className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={userHref(user, rangeQuery)} className="font-medium hover:underline">
                {user.name}
              </Link>
              <p className="text-muted-foreground truncate text-xs">{user.email}</p>
              <p className="text-muted-foreground truncate text-xs">{user.roles ?? 'No Roles'}</p>
            </div>
            <StatusBadge isActive={user.isActive} />
          </div>
          <p className="text-muted-foreground text-xs">
            {formatCount(user.signInCount, 'sign-in')} ·{' '}
            {formatCount(user.failedSignInCount, 'failed attempt')} ·{' '}
            {formatCount(user.actionCount, 'action')} ·{' '}
            {formatCount(user.activeSessionCount, 'active Session')}
          </p>
          <p className="text-muted-foreground font-mono text-xs">
            Last sign-in{' '}
            {user.lastSignInAt
              ? `${splitAuditTime(user.lastSignInAt, timeZone).date} ${splitAuditTime(user.lastSignInAt, timeZone).time}`
              : 'never recorded'}
          </p>
        </li>
      ))}
    </ul>
  );
}

function TableHeadings() {
  return (
    <TableHeader>
      <TableRow>
        {COLUMNS.map((column, index) => (
          <TableHead
            key={column}
            className={cn('whitespace-nowrap', index === 0 && 'pl-4', index >= 5 && 'text-right')}
          >
            {column}
          </TableHead>
        ))}
        <TableHead className="pr-4 text-right">
          <span className="sr-only">Open</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

function UserTable({
  users,
  timeZone,
  rangeQuery,
}: TimeZoneProp & { users: UserAuditListItem[]; rangeQuery: string }) {
  return (
    <div className="hidden md:block">
      <Table className={TABLE_MIN_WIDTH}>
        <TableHeadings />
        <TableBody>
          {users.map((user) => {
            const device = describeUserAgent(user.lastSignInUserAgent);

            return (
              <TableRow key={user.userId} className="align-top">
                <TableCell className="max-w-64 pl-4">
                  <Link
                    href={userHref(user, rangeQuery)}
                    className="hover:text-primary block truncate font-medium hover:underline"
                  >
                    {user.name}
                  </Link>
                  <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                  {user.staffCode ? (
                    <p className="text-muted-foreground font-mono text-xs">{user.staffCode}</p>
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-56 whitespace-normal">
                  {user.roles ?? '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge isActive={user.isActive} />
                </TableCell>
                <TableCell>
                  <When value={user.lastSignInAt} timeZone={timeZone} />
                  {user.lastSignInAt ? (
                    <p className="text-muted-foreground text-xs whitespace-nowrap">
                      {[user.lastSignInIp, device].filter(Boolean).join(' · ')}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <When value={user.lastActivityAt} timeZone={timeZone} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{user.signInCount}</TableCell>
                <TableCell className="text-right">
                  <FailedCount count={user.failedSignInCount} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{user.activeSessionCount}</TableCell>
                <TableCell className="text-right tabular-nums">{user.actionCount}</TableCell>
                <TableCell className="pr-4 text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <Link
                      href={userHref(user, rangeQuery)}
                      aria-label={`User Audit for ${user.name}`}
                    >
                      <CiRead className="size-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function UserAuditTable({
  users,
  total,
  page,
  totalPages,
  timeZone,
  rangeQuery,
  isFetching,
  onPageChange,
}: TimeZoneProp & {
  users: UserAuditListItem[];
  total: number;
  page: number;
  totalPages: number;
  /** The date range as a query string, carried to each user's page. */
  rangeQuery: string;
  isFetching: boolean;
  onPageChange: (next: number) => void;
}) {
  return (
    <Card className="py-0">
      <CardContent className="p-0">
        <div className={cn(isFetching && 'opacity-70 transition-opacity')}>
          <UserCards users={users} timeZone={timeZone} rangeQuery={rangeQuery} />
          <UserTable users={users} timeZone={timeZone} rangeQuery={rangeQuery} />
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t p-3 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            {formatCount(total, 'user')}
            {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
          </p>
          {totalPages > 1 ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// Per-column skeleton widths, in the order of COLUMNS: [first line, second line or null].
const SKELETON_CELLS: [string, string | null][] = [
  ['w-32', 'w-40'],
  ['w-28', null],
  ['w-16', null],
  ['w-24', 'w-32'],
  ['w-24', 'w-16'],
  ['w-8', null],
  ['w-8', null],
  ['w-8', null],
  ['w-10', null],
];

// Mirrors both layouts of the loaded list: the phone cards and the desktop table, with the same
// header, one sized skeleton per cell, and the count footer.
export function UserAuditTableSkeleton() {
  return (
    <Card className="py-0" aria-label="Loading User Audit">
      <CardContent className="p-0">
        <ul className="divide-y md:hidden" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index} className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-44" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-40" />
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <Table className={TABLE_MIN_WIDTH}>
            <TableHeadings />
            <TableBody>
              {Array.from({ length: AUDIT_LOG_PAGE_SIZE }, (_, row) => (
                <TableRow key={row}>
                  {SKELETON_CELLS.map(([first, second], index) => (
                    <TableCell key={index} className={cn(index === 0 && 'pl-4')}>
                      <div className={cn('space-y-1.5', index >= 5 && 'flex flex-col items-end')}>
                        <Skeleton className={cn('h-4', first)} />
                        {second ? <Skeleton className={cn('h-3', second)} /> : null}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="pr-4">
                    <Skeleton className="ml-auto size-9" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t p-3">
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
