import Link from 'next/link';
import { ArrowRight, Wrench } from 'lucide-react';

import type { WorkOrder } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type UpcomingMaintenanceTableProps = {
  workOrders: WorkOrder[];
};

function MasterBadge({ name, color }: { name: string; color: string }) {
  return (
    <Badge variant="outline">
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {name}
    </Badge>
  );
}

export function UpcomingMaintenanceTable({ workOrders }: UpcomingMaintenanceTableProps) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div>
          <CardTitle>Upcoming maintenance</CardTitle>
          <CardDescription>Scheduled &amp; in-progress work orders</CardDescription>
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
        {workOrders.length === 0 ? (
          <Empty className="min-h-40 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Wrench className="size-5" />
              </EmptyMedia>
              <EmptyTitle>No upcoming maintenance</EmptyTitle>
              <EmptyDescription>
                No scheduled or in-progress Work Orders right now.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
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
              {workOrders.map((workOrder) => (
                <TableRow key={workOrder.id}>
                  <TableCell className="pl-4 font-mono text-xs">{workOrder.code}</TableCell>
                  <TableCell className="font-medium">{workOrder.asset.name}</TableCell>
                  <TableCell className="text-muted-foreground">{workOrder.type.name}</TableCell>
                  <TableCell>
                    <MasterBadge name={workOrder.priority.name} color={workOrder.priority.color} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {workOrder.technician || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {workOrder.dueDate || '—'}
                  </TableCell>
                  <TableCell className="pr-4">
                    <MasterBadge name={workOrder.status.name} color={workOrder.status.color} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
