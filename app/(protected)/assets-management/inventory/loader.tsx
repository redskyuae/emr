import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function InventoryLoader() {
  return (
    <div className="space-y-4" aria-label="Loading asset inventory">
      <Card className="shadow-fluent-2">
        <CardHeader className="gap-1.5 border-b">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="grid gap-2 sm:grid-cols-3 2xl:w-full 2xl:max-w-xl">
              <Skeleton className="h-9 w-full sm:col-span-2" />
              <Skeleton className="h-9 w-full sm:col-span-1" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center 2xl:ml-auto 2xl:justify-end">
              <Skeleton className="h-9 w-32" />
            </div>
          </div>

          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Asset</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next service</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="py-3 pl-4">
                    <div className="flex min-w-64 items-center gap-3">
                      <Skeleton className="size-10 shrink-0 rounded-md" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-40 items-center gap-2">
                      <Skeleton className="size-2.5 shrink-0 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="min-w-52">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-36 space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="pr-4">
                    <Skeleton className="ml-auto h-8 w-16 rounded-md" />
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
