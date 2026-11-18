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

type SkeletonPermissions = {
  canEdit: boolean;
  canDelete: boolean;
};

// One page of records, matching PAGE_SIZE in the page container.
const ROWS = Array.from({ length: 10 }, (_, i) => i);

function TableSkeleton({ canEdit, canDelete }: SkeletonPermissions) {
  return (
    <Card className="py-0">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Modified on</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((row) => (
                <TableRow key={row}>
                  <TableCell className="pl-4">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3.5 w-8" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {canEdit || canDelete ? <Skeleton className="ml-auto size-8" /> : null}
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

function CardViewSkeleton({ canEdit, canDelete }: SkeletonPermissions) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ROWS.map((row) => (
        <Card key={row}>
          <CardContent className="space-y-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
            {canEdit || canDelete ? (
              <div className="flex gap-2 border-t pt-3">
                {canEdit ? <Skeleton className="h-8 w-16" /> : null}
                {canDelete ? <Skeleton className="h-8 w-20" /> : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListViewSkeleton({ canEdit, canDelete }: SkeletonPermissions) {
  return (
    <div className="space-y-3">
      {ROWS.map((row) => (
        <Card key={row}>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
            {canEdit || canDelete ? (
              <div className="shrink-0 pl-13 sm:pl-0">
                <Skeleton className="size-8" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PaginationSkeleton() {
  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <Skeleton className="h-4 w-36" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// Mirrors the loaded view in the current layout, including the pagination row beneath it.
export function ViewSkeleton({
  layout,
  canEdit,
  canDelete,
}: SkeletonPermissions & { layout: ViewLayout }) {
  return (
    <div className="space-y-4">
      {layout === 'card' ? (
        <CardViewSkeleton canEdit={canEdit} canDelete={canDelete} />
      ) : layout === 'list' ? (
        <ListViewSkeleton canEdit={canEdit} canDelete={canDelete} />
      ) : (
        <TableSkeleton canEdit={canEdit} canDelete={canDelete} />
      )}
      <PaginationSkeleton />
    </div>
  );
}
