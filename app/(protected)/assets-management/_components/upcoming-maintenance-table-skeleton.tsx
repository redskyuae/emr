import Link from 'next/link';
import { PiArrowRightLight } from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// The overview shows at most five upcoming Work Orders.
const ROW_COUNT = 5;

// Mirrors the loaded table: the same header and one sized skeleton per cell.
export function UpcomingMaintenanceTableSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b">
        <div>
          <CardTitle>Upcoming maintenance</CardTitle>
          <CardDescription>Scheduled &amp; in-progress work orders</CardDescription>
        </div>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/assets-management/maintenance">
              <span>All work orders</span>
              <PiArrowRightLight className="size-3.5" />
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
            {Array.from({ length: ROW_COUNT }, (_, row) => (
              <TableRow key={row}>
                <TableCell className="pl-4">
                  <Skeleton className="h-3 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-36" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3 w-20" />
                </TableCell>
                <TableCell className="pr-4">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
