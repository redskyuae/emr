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

type ActionFlags = { canEdit: boolean; canDelete: boolean };

// One page of Diagnosis Codes, matching PAGE_SIZE in the page container.
const ROW_COUNT = 10;
const CARD_COUNT = 6;

// Mirrors DiagnosisCodeTableView: the same header and one sized skeleton per cell. The actions cell
// stays empty when the user can neither edit nor delete, as it does in the loaded table.
function TableSkeleton({ canEdit, canDelete }: ActionFlags) {
  return (
    <Card className="py-0">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: ROW_COUNT }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
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

function CardViewSkeleton({ canEdit, canDelete }: ActionFlags) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: CARD_COUNT }, (_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3">
            <Skeleton className="size-10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="mt-1.5 h-4 w-44" />
              <Skeleton className="mt-1.5 h-4 w-32" />
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

function ListViewSkeleton({ canEdit, canDelete }: ActionFlags) {
  return (
    <div className="space-y-3">
      {Array.from({ length: ROW_COUNT }, (_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
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

// The current layout's skeleton plus the pagination row below it, so the loading state has the
// same shape as the loaded page.
export function ViewSkeleton({ layout, ...flags }: { layout: ViewLayout } & ActionFlags) {
  return (
    <div className="space-y-4">
      {layout === 'card' ? (
        <CardViewSkeleton {...flags} />
      ) : layout === 'list' ? (
        <ListViewSkeleton {...flags} />
      ) : (
        <TableSkeleton {...flags} />
      )}
      <PaginationSkeleton />
    </div>
  );
}
