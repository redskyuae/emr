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
import { cn } from '@/lib/utils';

type ViewLayout = 'table' | 'card' | 'list';

// Same page size as the Rooms list, so the skeleton holds the height of a full page.
const ROW_COUNT = 10;

// A text placeholder held to the line height of the text it stands in for.
function TextLine({ line = 'h-5', className }: { line?: string; className: string }) {
  return (
    <div className={cn('flex items-center', line)}>
      <Skeleton className={cn('h-3.5', className)} />
    </div>
  );
}

// The Room Type swatch dot and its name.
function RoomTypeSkeleton({ className }: { className: string }) {
  return (
    <div className="flex h-5 items-center gap-1.5">
      <Skeleton className="size-2.5 rounded-full" />
      <Skeleton className={cn('h-3.5', className)} />
    </div>
  );
}

function TableSkeleton({ showActions }: { showActions: boolean }) {
  return (
    <Card className="py-0">
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
              {Array.from({ length: ROW_COUNT }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <TextLine className="w-12" />
                  </TableCell>
                  <TableCell>
                    <RoomTypeSkeleton className="w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <TextLine className="ml-auto w-5" />
                  </TableCell>
                  <TableCell>
                    <TextLine className="w-28" />
                  </TableCell>
                  <TableCell>
                    <TextLine className="w-24" />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {showActions ? <Skeleton className="ml-auto size-8" /> : null}
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

function CardViewSkeleton({ showActions }: { showActions: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: ROW_COUNT }, (_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="space-y-0.5">
              <TextLine line="h-6" className="h-4 w-24" />
              <RoomTypeSkeleton className="w-24" />
              <TextLine className="w-40" />
              <TextLine className="w-28" />
            </div>
            {showActions ? (
              <div className="flex gap-2 border-t pt-3">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListViewSkeleton({ showActions }: { showActions: boolean }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: ROW_COUNT }, (_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <TextLine line="h-6" className="h-4 w-24" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-14 sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <RoomTypeSkeleton className="w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <TextLine className="w-12" />
              <TextLine className="w-28" />
            </div>
            {showActions ? (
              <div className="shrink-0 pl-14 sm:pl-0">
                <Skeleton className="size-8" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Mirrors the current Rooms layout (table, card or list) and the pagination row beneath it.
 * `showActions` matches the action permissions the loaded view renders; the route loader cannot
 * know them yet, so it keeps the default.
 */
export function ViewSkeleton({
  layout,
  showActions = true,
}: {
  layout: ViewLayout;
  showActions?: boolean;
}) {
  return (
    <div className="space-y-4">
      {layout === 'card' ? (
        <CardViewSkeleton showActions={showActions} />
      ) : layout === 'list' ? (
        <ListViewSkeleton showActions={showActions} />
      ) : (
        <TableSkeleton showActions={showActions} />
      )}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <TextLine className="w-36" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
