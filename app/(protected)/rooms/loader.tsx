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

export default function RoomsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="shadow-fluent-2">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="size-9 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-fluent-2">
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-full lg:max-w-xs" />
          <Skeleton className="h-9 w-full lg:w-40" />
          <Skeleton className="h-9 w-full lg:w-44" />
          <div className="flex gap-2 lg:ml-auto">
            <Skeleton className="h-9 w-32" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[860px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[14%] pl-4">Room</TableHead>
                  <TableHead className="w-[18%]">Type</TableHead>
                  <TableHead className="w-[14%]">Status</TableHead>
                  <TableHead className="w-[9%] text-right">Beds</TableHead>
                  <TableHead className="w-[17%]">Location</TableHead>
                  <TableHead className="w-[18%]">Department</TableHead>
                  <TableHead className="w-[10%] pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4">
                      <Skeleton className="h-5 w-2/3" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-3/4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-5 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-3/4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-3/4" />
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

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <Skeleton className="h-5 w-36" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
