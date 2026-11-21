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

export default function AuditLogPageLoader() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading audit log">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-full lg:max-w-sm" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-16" />
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:ml-auto">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-full sm:w-24" />
          </div>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-0">
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
              {Array.from({ length: 10 }, (_, row) => (
                <TableRow key={row}>
                  <TableCell className="pl-4">
                    <Skeleton className="h-3 w-32" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-8 shrink-0 rounded-full" />
                      <div>
                        <div className="flex h-5 items-center">
                          <Skeleton className="h-3.5 w-28" />
                        </div>
                        <div className="flex h-4 items-center">
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3.5 w-28" />
                  </TableCell>
                  <TableCell className="max-w-sm">
                    <Skeleton className="h-3.5 w-64 max-w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-24" />
                  </TableCell>
                  <TableCell className="pr-4">
                    <Skeleton className="h-6 w-16 rounded-full" />
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
