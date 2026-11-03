'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { CalendarX2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OUTREACH_STAFF } from '../_utils/activity-options';
import { formatLongDate, formatTime, formatWeekday } from '../_utils/outreach-dates';
import {
  DATE_RANGE_OPTIONS,
  filterActivities,
  type ActivityFilters,
  type DateRange,
} from '../_utils/outreach-filters';
import { activityContactCount } from '../_utils/outreach-ledger';
import { ACTIVITY_TYPE_LABEL, activityLocation, staffName } from '../_utils/outreach-presentation';
import type { ActivityType, OutreachActivity, OutreachState } from '../_utils/outreach-types';
import { ActivityStatusBadge, ActivityTypeBadge } from './outreach-badges';
import { FilterSelect } from './outreach-fields';

const TYPE_OPTIONS = (Object.keys(ACTIVITY_TYPE_LABEL) as ActivityType[]).map((value) => ({
  value,
  label: ACTIVITY_TYPE_LABEL[value],
}));

const STAFF_OPTIONS = OUTREACH_STAFF.map((staff) => ({ value: staff.id, label: staff.name }));

function GroupRow({ label }: { label: string }) {
  return (
    <TableRow className="bg-muted/40 hover:bg-muted/40">
      <TableCell colSpan={7} className="text-muted-foreground py-2 text-xs font-semibold uppercase">
        {label}
      </TableCell>
    </TableRow>
  );
}

function ActivityRow({ state, activity }: { state: OutreachState; activity: OutreachActivity }) {
  const count = activityContactCount(state, activity);

  return (
    <TableRow>
      <TableCell className="min-w-64 whitespace-normal">
        <div className="flex flex-col items-start gap-1.5">
          <ActivityTypeBadge type={activity.type} />
          <span className="font-medium">{activity.title}</span>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <div>{formatLongDate(activity.date)}</div>
        <div className="text-muted-foreground text-xs">
          {formatWeekday(activity.date)}
          {activity.startTime ? ` · ${formatTime(activity.startTime)}` : ''}
        </div>
      </TableCell>
      <TableCell className="min-w-40 whitespace-normal">{activityLocation(activity)}</TableCell>
      <TableCell className="text-muted-foreground min-w-40 whitespace-normal">
        {activity.staffIds.map(staffName).join(', ')}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {count > 0 ? (
          <Button variant="link" className="h-auto p-0 font-semibold tabular-nums" asChild>
            <Link
              href={`/community-outreach?tab=contacts&source=${activity.id}`}
              aria-label={`View ${count} contacts from ${activity.title}`}
            >
              {count}
            </Link>
          </Button>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <ActivityStatusBadge status={activity.status} />
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href={`/community-outreach/activities/${activity.id}`}
            aria-label={`Open ${activity.title}`}
          >
            Open
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function ActivitiesPanel({ state }: { state: OutreachState }) {
  const [today] = useState(() => new Date());
  const [filters, setFilters] = useState<ActivityFilters>({
    type: null,
    staff: null,
    query: '',
    range: '30',
  });
  const rows = filterActivities(state.activities, filters, today);
  const groups = [
    {
      label: 'Upcoming',
      items: rows
        .filter((activity) => activity.status === 'planned')
        .sort((a, b) => a.date.localeCompare(b.date)),
    },
    {
      label: 'Completed',
      items: rows
        .filter((activity) => activity.status === 'completed')
        .sort((a, b) => b.date.localeCompare(a.date)),
    },
  ];

  return (
    <section aria-label="Activities" className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <InputGroup className="bg-background shadow-fluent-2 h-9 sm:max-w-sm sm:flex-1">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={filters.query}
            onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            placeholder="Search by title, location or staff"
            aria-label="Search activities"
          />
        </InputGroup>
        <FilterSelect
          label="Activity type"
          allLabel="All types"
          value={filters.type}
          options={TYPE_OPTIONS}
          onChange={(type) => setFilters({ ...filters, type: type as ActivityType | null })}
        />
        <FilterSelect
          label="Staff"
          allLabel="All staff"
          value={filters.staff}
          options={STAFF_OPTIONS}
          onChange={(staff) => setFilters({ ...filters, staff })}
        />
        <FilterSelect
          label="Date range"
          allLabel="All dates"
          value={filters.range === 'all' ? null : filters.range}
          options={DATE_RANGE_OPTIONS.filter((option) => option.value !== 'all')}
          onChange={(range) => setFilters({ ...filters, range: (range ?? 'all') as DateRange })}
        />
      </div>

      <Card className="shadow-fluent-2 gap-0 overflow-hidden py-0">
        {rows.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarX2 />
              </EmptyMedia>
              <EmptyTitle>No activities match</EmptyTitle>
              <EmptyDescription>
                Clear a filter, or{' '}
                <Link
                  href="/community-outreach/activities/new"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  log a new activity
                </Link>
                .
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Activity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Assigned staff</TableHead>
                <TableHead className="text-right">Contacts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups
                .filter((group) => group.items.length > 0)
                .map((group) => (
                  <Fragment key={group.label}>
                    <GroupRow label={group.label} />
                    {group.items.map((activity) => (
                      <ActivityRow key={activity.id} state={state} activity={activity} />
                    ))}
                  </Fragment>
                ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <p className="text-muted-foreground text-xs">
        Contact counts link to the people recorded at each activity.
      </p>
    </section>
  );
}
