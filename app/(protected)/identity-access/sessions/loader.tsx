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

export default function SessionsPageLoader() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading sessions">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-full lg:max-w-sm" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="h-9 w-full sm:w-32 lg:ml-auto" />
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-0">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">User</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="pr-4 text-right">Revoke</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 7 }, (_, row) => (
                <TableRow key={row}>
                  <TableCell className="pl-4">
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
                    <Skeleton className="h-3.5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3.5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-28" />
                  </TableCell>
                  <TableCell className="pr-4">
                    <Skeleton className="ml-auto h-8 w-20" />
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
