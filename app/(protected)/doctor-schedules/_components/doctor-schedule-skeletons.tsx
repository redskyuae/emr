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
import type { ViewLayout } from './doctor-schedules-toolbar';

// Same page size as the Doctor Schedules list, so the skeleton holds the height of a full page.
const ROW_COUNT = 10;

// A text placeholder held to the line height of the text it stands in for.
function TextLine({ line = 'h-5', className }: { line?: string; className: string }) {
  return (
    <div className={cn('flex items-center', line)}>
      <Skeleton className={cn('h-3.5', className)} />
    </div>
  );
}

function IconTextLine({ className }: { className: string }) {
  return (
    <div className="flex h-5 items-center gap-1.5">
      <Skeleton className="size-3.5 rounded-full" />
      <Skeleton className={cn('h-3.5', className)} />
    </div>
  );
}

function TableSkeleton({ canEdit }: { canEdit: boolean }) {
  return (
    <Card className="py-0">
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
              {Array.from({ length: ROW_COUNT }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <TextLine className="w-32" />
                  </TableCell>
                  <TableCell>
                    <TextLine className="w-48" />
                  </TableCell>
                  <TableCell>
                    <TextLine className="w-40" />
                    <TextLine line="h-4" className="h-3 w-48" />
                  </TableCell>
                  <TableCell>
                    <TextLine className="w-14" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {canEdit ? <Skeleton className="ml-auto size-9" /> : null}
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

function CardViewSkeleton({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: ROW_COUNT }, (_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-1">
              <TextLine line="h-6" className="h-4 w-36" />
              <IconTextLine className="w-44" />
              <IconTextLine className="w-24" />
            </div>
            <div className="space-y-0.5">
              <TextLine className="w-40" />
              <TextLine line="h-4" className="h-3 w-48" />
            </div>
            {canEdit ? (
              <div className="flex gap-2 border-t pt-3">
                <Skeleton className="h-8 w-16" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListViewSkeleton({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: ROW_COUNT }, (_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:w-64 sm:shrink-0">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0">
                <TextLine line="h-6" className="h-4 w-32" />
                <TextLine className="w-44" />
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-14 sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div className="min-w-0 sm:flex-1">
                <TextLine className="w-40" />
                <TextLine line="h-4" className="h-3 w-48" />
              </div>
              <TextLine className="w-14" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            {canEdit ? (
              <div className="shrink-0 pl-14 sm:pl-0">
                <Skeleton className="size-9" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Mirrors the current Doctor Schedules layout and the "Showing x-y of z" row beneath it.
 * `canEdit` matches the edit control the loaded view renders; the route loader cannot know the
 * permission yet, so it keeps the default.
 */
export function DoctorScheduleViewSkeleton({
  layout,
  canEdit = true,
}: {
  layout: ViewLayout;
  canEdit?: boolean;
}) {
  return (
    <div className="space-y-4">
      {layout === 'card' ? (
        <CardViewSkeleton canEdit={canEdit} />
      ) : layout === 'list' ? (
        <ListViewSkeleton canEdit={canEdit} />
      ) : (
        <TableSkeleton canEdit={canEdit} />
      )}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <TextLine className="w-44" />
      </div>
    </div>
  );
}
