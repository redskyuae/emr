'use client';

import { useMemo, useState } from 'react';
import { Activity, Download, Search } from 'lucide-react';

import type { IamAuditEvent } from '@/app/(protected)/identity-access/dashboard/mock-data';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { formatCount } from '@/lib/format-count';
import { cn } from '@/lib/utils';

type AuditTypeFilter = 'All' | 'Auth' | 'Create' | 'Edit' | 'Delete' | 'Critical';

const auditTypeFilters: AuditTypeFilter[] = ['All', 'Auth', 'Create', 'Edit', 'Delete', 'Critical'];

const eventTypeByFilter: Partial<Record<AuditTypeFilter, IamAuditEvent['type']>> = {
  Auth: 'AUTH',
  Create: 'CREATE',
  Edit: 'MODIFY',
  Delete: 'DELETE',
  Critical: 'CRITICAL',
};

const auditTypeLabelByType: Record<IamAuditEvent['type'], string> = {
  AUTH: 'Auth',
  CREATE: 'Create',
  MODIFY: 'Modify',
  DELETE: 'Delete',
  CRITICAL: 'Critical',
};

const auditBadgeClassByType: Record<IamAuditEvent['type'], string> = {
  AUTH: 'border-chart-5/20 bg-chart-5/10 text-chart-5',
  CREATE: 'border-chart-4/20 bg-chart-4/10 text-chart-4',
  MODIFY: 'border-chart-2/20 bg-chart-2/10 text-chart-2',
  DELETE: 'border-destructive/20 bg-destructive/10 text-destructive',
  CRITICAL: 'border-destructive/20 bg-destructive/10 text-destructive',
};

function eventMatchesTypeFilter(filter: AuditTypeFilter, event: IamAuditEvent) {
  if (filter === 'All') {
    return true;
  }

  return event.type === eventTypeByFilter[filter];
}

function eventMatchesSearch(searchTerm: string, event: IamAuditEvent) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    event.when,
    event.actorName,
    event.actorEmail,
    event.action,
    event.target,
    event.details,
    event.ipAddress,
    auditTypeLabelByType[event.type],
  ]
    .join(' ')
    .toLowerCase()
    .includes(normalizedSearch);
}

export function AuditLogPageImpl({ events }: { events: IamAuditEvent[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<AuditTypeFilter>('All');

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          eventMatchesTypeFilter(typeFilter, event) && eventMatchesSearch(searchTerm, event)
      ),
    [events, searchTerm, typeFilter]
  );

  return (
    <div className="space-y-4">
      <Card className="shadow-fluent-2">
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-sm">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search audit events"
              aria-label="Search audit events"
            />
          </InputGroup>

          <div className="flex flex-wrap gap-2">
            {auditTypeFilters.map((filter) => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={typeFilter === filter ? 'default' : 'outline'}
                onClick={() => setTypeFilter(filter)}
                aria-pressed={typeFilter === filter}
              >
                {filter}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:ml-auto">
            <span className="text-muted-foreground text-sm">
              {formatCount(filteredEvents.length, 'event')} shown
            </span>
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardContent className="p-0">
          {filteredEvents.length ? (
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="pr-4">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-muted-foreground pl-4 font-mono text-xs">
                      {event.when}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{event.actorInitials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{event.actorName}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            {event.actorEmail}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{event.action}</TableCell>
                    <TableCell className="text-muted-foreground">{event.target}</TableCell>
                    <TableCell className="text-muted-foreground max-w-sm whitespace-normal">
                      {event.details}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {event.ipAddress}
                    </TableCell>
                    <TableCell className="pr-4">
                      <Badge
                        variant="outline"
                        className={cn('font-mono', auditBadgeClassByType[event.type])}
                      >
                        {auditTypeLabelByType[event.type]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="min-h-72 border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Activity className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No events match.</EmptyTitle>
                <EmptyDescription>Try a different search term or type filter.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
