import Link from 'next/link';
import { AlertTriangle, ArrowRight, Banknote, Boxes, ClipboardList, Wrench } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  assetCategories,
  AssetCategory,
  assets,
  formatAedCompact,
  WorkOrder,
  workOrderPriorityBadgeMap,
  workOrders,
  workOrderStatusBadgeMap,
} from './mock-data';

const totalAssetValue = assets.reduce((total, asset) => total + asset.value, 0);
const outOfServiceCount = assets.filter(
  (asset) => asset.status === 'maintenance' || asset.status === 'repair'
).length;
const openWorkOrders = workOrders.filter((workOrder) => workOrder.status !== 'completed');
const attentionWorkOrders = openWorkOrders.filter(
  (workOrder) => workOrder.status === 'overdue' || workOrder.priority === 'Critical'
);

const upcomingMaintenanceWorkOrders = workOrders.filter(
  (workOrder) => workOrder.status === 'scheduled' || workOrder.status === 'in-progress'
);

const categoryCounts = assetCategories.map((category) => ({
  ...category,
  count: assets.filter((asset) => asset.categoryId === category.id).length,
}));
const maxCategoryCount = Math.max(...categoryCounts.map((category) => category.count), 1);

const assetStats = [
  {
    label: 'Total assets',
    value: assets.length.toLocaleString('en-US'),
    subText: '+4 this quarter',
    icon: Boxes,
  },
  {
    label: 'Portfolio value',
    value: formatAedCompact(totalAssetValue),
    subText: 'net book value',
    icon: Banknote,
  },
  {
    label: 'Out of service',
    value: outOfServiceCount.toLocaleString('en-US'),
    subText: '-1 maintenance / repair',
    icon: Wrench,
  },
  {
    label: 'Open work orders',
    value: openWorkOrders.length.toLocaleString('en-US'),
    subText: '+2 · 2 overdue',
    icon: ClipboardList,
  },
];

function badgeWithDot(config: { label: string; className: string; dotClassName: string }) {
  return (
    <Badge variant="outline" className={config.className}>
      <span className={cn('size-1.5 rounded-full', config.dotClassName)} aria-hidden="true" />
      {config.label}
    </Badge>
  );
}

function getAttentionTone(workOrder: WorkOrder) {
  if (workOrder.priority === 'Critical') {
    return {
      iconClassName: 'bg-destructive/10 text-destructive',
      idClassName: 'text-destructive',
    };
  }

  return {
    iconClassName: 'bg-chart-5/10 text-chart-5',
    idClassName: 'text-chart-5',
  };
}

function CategoryDistributionRow({ category }: { category: AssetCategory & { count: number } }) {
  const percentage = Math.max((category.count / maxCategoryCount) * 100, category.count ? 8 : 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn('size-2.5 shrink-0 rounded-full', category.color)}
            aria-hidden="true"
          />
          <span className="truncate font-medium">{category.name}</span>
        </div>
        <span className="text-muted-foreground shrink-0 tabular-nums">{category.count}</span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className={cn('h-full rounded-full', category.color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function AssetOverviewPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {assetStats.map((stat) => (
          <Card key={stat.label} className="shadow-fluent-2">
            <CardContent className="flex min-h-36 flex-col justify-between gap-5 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                  <stat.icon className="size-4" />
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-3xl leading-none font-semibold tabular-nums">{stat.value}</p>
                <p className="text-muted-foreground text-sm">{stat.subText}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="shadow-fluent-2">
          <CardHeader className="border-b">
            <div>
              <CardTitle>Assets by category</CardTitle>
              <CardDescription>Distribution across the estate</CardDescription>
            </div>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link href="/assets-management/inventory">
                  <span>Inventory</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-5 p-4">
            {categoryCounts.map((category) => (
              <CategoryDistributionRow key={category.id} category={category} />
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-fluent-2">
          <CardHeader className="border-b">
            <div>
              <CardTitle>Attention required</CardTitle>
              <CardDescription>Overdue & critical items</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {attentionWorkOrders.map((workOrder) => {
              const tone = getAttentionTone(workOrder);

              return (
                <div key={workOrder.id} className="flex items-start gap-3 p-4">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-md',
                      tone.iconClassName
                    )}
                  >
                    <AlertTriangle className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 font-medium">{workOrder.assetLabel}</p>
                      <span className={cn('shrink-0 font-mono text-xs', tone.idClassName)}>
                        {workOrder.id}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-5">{workOrder.note}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-fluent-2">
        <CardHeader className="border-b">
          <div>
            <CardTitle>Upcoming maintenance</CardTitle>
            <CardDescription>Scheduled & in-progress work orders</CardDescription>
          </div>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href="/assets-management/maintenance">
                <span>All work orders</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Work order</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="pr-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingMaintenanceWorkOrders.slice(0, 5).map((workOrder) => (
                <TableRow key={workOrder.id}>
                  <TableCell className="pl-4 font-mono text-xs">{workOrder.id}</TableCell>
                  <TableCell className="font-medium">{workOrder.assetLabel}</TableCell>
                  <TableCell className="text-muted-foreground">{workOrder.type}</TableCell>
                  <TableCell>
                    {badgeWithDot(workOrderPriorityBadgeMap[workOrder.priority])}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{workOrder.technician}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
