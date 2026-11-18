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
import type { ViewLayout } from './doctor-schedules-toolbar';

function TableSkeleton() {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Doctor</TableHead>
                <TableHead>Date range</TableHead>
                <TableHead>Rotas</TableHead>
                <TableHead>Slot duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10 pr-4" aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <Skeleton className="h-5 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Skeleton className="ml-auto h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CardViewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2 border-t pt-3">
              <Skeleton className="h-8 w-14" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListViewSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <Card key={i} className="shadow-fluent-2">
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-8 shrink-0" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DoctorScheduleViewSkeleton({ layout }: { layout: ViewLayout }) {
  if (layout === 'card') return <CardViewSkeleton />;
  if (layout === 'list') return <ListViewSkeleton />;
  return <TableSkeleton />;
}
