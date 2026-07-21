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

type ViewLayout = 'table' | 'card' | 'list';

function TableSkeleton() {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[820px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%] pl-4">Name</TableHead>
                <TableHead className="w-[12%]">Code</TableHead>
                <TableHead className="w-[16%]">Category</TableHead>
                <TableHead className="w-[10%]">Color</TableHead>
                <TableHead className="w-[26%]">Description</TableHead>
                <TableHead className="w-[14%] pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <Skeleton className="h-5 w-3/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-2/3" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-3/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="size-4 rounded-sm" />
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
  );
}

function CardViewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-8 w-16" />
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
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-8 w-8 shrink-0" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ViewSkeleton({ layout }: { layout: ViewLayout }) {
  if (layout === 'card') return <CardViewSkeleton />;
  if (layout === 'list') return <ListViewSkeleton />;
  return <TableSkeleton />;
}
