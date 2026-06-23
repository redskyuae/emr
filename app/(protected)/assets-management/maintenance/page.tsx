'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Search, Wrench } from 'lucide-react';

import { NewWorkOrderSheet } from '@/app/(protected)/assets-management/maintenance/_components/new-work-order-sheet';
import {
  workOrderPriorityBadgeMap,
  workOrders,
  workOrderStatusBadgeMap,
  type BadgeToneConfig,
  type WorkOrder,
  type WorkOrderType,
} from '@/app/(protected)/assets-management/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

type TypeFilter = WorkOrderType | 'all';

const typeFilters: { label: string; value: TypeFilter }[] = [
  { label: 'All types', value: 'all' },
  { label: 'Preventive', value: 'Preventive' },
  { label: 'Corrective', value: 'Corrective' },
  { label: 'Calibration', value: 'Calibration' },
  { label: 'Inspection', value: 'Inspection' },
];

const maintenanceStats = [
  {
    label: 'Open work orders',
    value: workOrders.filter(
      (workOrder) => workOrder.status === 'open' || workOrder.status === 'in-progress'
    ).length,
    subText: 'awaiting / in progress',
    icon: Wrench,
  },
  {
    label: 'Due this week',
    value: workOrders.filter((workOrder) => workOrder.status === 'scheduled').length,
    subText: 'scheduled soon',
    icon: CalendarClock,
  },
  {
    label: 'Overdue',
    value: workOrders.filter((workOrder) => workOrder.status === 'overdue').length,
    subText: '+1 escalated',
    icon: AlertTriangle,
  },
  {
    label: 'Completed (30d)',
    value: workOrders.filter((workOrder) => workOrder.status === 'completed').length,
    subText: '+5 last 30 days',
    icon: CheckCircle2,
  },
];

function normalizeSearchTerm(value: string) {
  return value.trim().toLocaleLowerCase();
}

function workOrderMatchesSearch(workOrder: WorkOrder, searchTerm: string) {
  if (!searchTerm) {
    return true;
  }

  return [workOrder.id, workOrder.assetLabel, workOrder.technician, workOrder.note].some((value) =>
    value.toLocaleLowerCase().includes(searchTerm)
  );
}

function badgeWithDot(config: BadgeToneConfig) {
  return (
    <Badge variant="outline" className={config.className}>
      <span className={cn('size-1.5 rounded-full', config.dotClassName)} aria-hidden="true" />
      {config.label}
    </Badge>
  );
}

function formatResultSubtitle(filteredWorkOrders: WorkOrder[]) {
  const typeCount = new Set(filteredWorkOrders.map((workOrder) => workOrder.type)).size;
  const workOrderCountLabel = formatCount(filteredWorkOrders.length, 'Work Order');
  const typeCountLabel = formatCount(typeCount, 'type');

  return `${workOrderCountLabel} across ${typeCountLabel}`;
}

function WorkOrderAsset({ workOrder }: { workOrder: WorkOrder }) {
  return (
    <div className="max-w-sm min-w-72 space-y-1">
      <p className="truncate font-medium">{workOrder.assetLabel}</p>
      <p className="text-muted-foreground truncate text-xs">{workOrder.note}</p>
    </div>
  );
}

export default function AssetMaintenancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const filteredWorkOrders = useMemo(() => {
    const searchTerm = normalizeSearchTerm(searchQuery);

    return workOrders.filter((workOrder) => {
      const matchesSearch = workOrderMatchesSearch(workOrder, searchTerm);
      const matchesType = typeFilter === 'all' || workOrder.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [searchQuery, typeFilter]);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {maintenanceStats.map((stat) => (
          <Card key={stat.label} className="shadow-fluent-2">
            <CardContent className="flex min-h-36 flex-col justify-between gap-5 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                  <stat.icon className="size-4" />
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-3xl leading-none font-semibold tabular-nums">
                  {stat.value.toLocaleString('en-US')}
                </p>
                <p className="text-muted-foreground text-sm">{stat.subText}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="space-y-1">
        <h2 className="text-lg leading-tight font-semibold">Work Orders</h2>
        <p className="text-muted-foreground text-sm">{formatResultSubtitle(filteredWorkOrders)}</p>
      </div>

      <Card className="shadow-fluent-2">
        <CardHeader className="border-b">
          <div>
            <CardTitle>Maintenance queue</CardTitle>
            <CardDescription>Work Orders raised against tracked Assets.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
            <InputGroup className="bg-background h-9 2xl:max-w-sm">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search work orders…"
                aria-label="Search work orders"
                className="text-sm"
              />
            </InputGroup>

            <div className="flex flex-wrap gap-1.5">
              {typeFilters.map((filter) => {
                const isActive = typeFilter === filter.value;

                return (
                  <Button
                    key={filter.value}
                    type="button"
                    size="sm"
                    variant={isActive ? 'default' : 'outline'}
                    aria-pressed={isActive}
                    onClick={() => setTypeFilter(filter.value)}
                    className={cn(!isActive && 'bg-background')}
                  >
                    {filter.label}
                  </Button>
                );
              })}
            </div>

            <NewWorkOrderSheet />
          </div>

          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Work order</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="pr-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkOrders.length ? (
                filteredWorkOrders.map((workOrder) => (
                  <TableRow key={workOrder.id}>
                    <TableCell className="pl-4 font-mono text-xs font-semibold">
                      {workOrder.id}
                    </TableCell>
                    <TableCell className="py-3">
                      <WorkOrderAsset workOrder={workOrder} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{workOrder.type}</TableCell>
                    <TableCell>
                      {badgeWithDot(workOrderPriorityBadgeMap[workOrder.priority])}
                    </TableCell>
                    <TableCell className="text-muted-foreground min-w-40">
                      {workOrder.technician}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {workOrder.created}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {workOrder.due}
                    </TableCell>
                    <TableCell className="pr-4">
                      <Badge
                        variant="outline"
                        className={workOrderStatusBadgeMap[workOrder.status].className}
                      >
                        {workOrderStatusBadgeMap[workOrder.status].label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 py-8">
                      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md">
                        <Search className="size-4" />
                      </div>
                      <p className="font-medium">No Work Orders match your filters</p>
                      <p className="text-muted-foreground text-sm">
                        Try a different search or type filter.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
