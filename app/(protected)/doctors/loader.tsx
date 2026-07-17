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

export default function DoctorsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <Card className="shadow-fluent-2">
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-full lg:max-w-xs" />
          <Skeleton className="h-9 w-full lg:w-40" />
          <Skeleton className="h-9 w-full lg:w-48" />
          <div className="flex gap-2 lg:ml-auto">
            <Skeleton className="h-9 w-32" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[920px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[22%] pl-4">Doctor</TableHead>
                  <TableHead className="w-[16%]">Specialty</TableHead>
                  <TableHead className="w-[14%]">Staff code</TableHead>
                  <TableHead className="w-[18%]">Designation</TableHead>
                  <TableHead className="w-[12%]">Status</TableHead>
                  <TableHead className="w-[8%] pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4">
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="pr-4">
                      <Skeleton className="ml-auto h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
