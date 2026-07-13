<<<<<<< HEAD
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
=======
import { Skeleton } from '@/components/ui/skeleton';
>>>>>>> 7a21517 (integrate Work Order Type master screen)

export default function WorkOrderTypesPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
<<<<<<< HEAD
      <Card className="shadow-fluent-2">
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-full lg:max-w-sm" />
          <div className="flex gap-2 lg:ml-auto">
            <Skeleton className="h-9 w-44" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4">
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="size-4 rounded-sm" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-40" />
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
=======
      <div className="bg-card shadow-fluent-2 flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-full lg:max-w-sm" />
        <div className="flex gap-2 lg:ml-auto">
          <Skeleton className="h-9 w-44" />
        </div>
      </div>

      <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b">
                <th className="p-3 pl-4">
                  <Skeleton className="h-4 w-12" />
                </th>
                <th className="p-3">
                  <Skeleton className="h-4 w-10" />
                </th>
                <th className="p-3">
                  <Skeleton className="h-4 w-12" />
                </th>
                <th className="p-3">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th className="p-3 pr-4 text-right">
                  <Skeleton className="ml-auto h-4 w-14" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="p-3 pl-4">
                    <Skeleton className="h-5 w-32" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="size-4 rounded-sm" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-5 w-40" />
                  </td>
                  <td className="p-3 pr-4 text-right">
                    <Skeleton className="ml-auto h-8 w-8" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
>>>>>>> 7a21517 (integrate Work Order Type master screen)

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
