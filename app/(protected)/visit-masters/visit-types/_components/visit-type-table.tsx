'use client';

import { CiEdit, CiTrash } from 'react-icons/ci';
import { PiDotsThreeLight } from 'react-icons/pi';

import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  tableCellClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from '@/components/ui/table-styles';
import { cn } from '@/lib/utils';

export function VisitTypeTable({
  visitTypes,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  visitTypes: VisitType[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (visitType: VisitType) => void;
  onDelete: (visitType: VisitType) => void;
}) {
  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeadCellClass}>Name</th>
              <th className={tableHeadCellClass}>Code</th>
              <th className={tableHeadCellClass}>Description</th>
              <th className={cn(tableHeadCellClass, 'text-right')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visitTypes.map((visitType) => (
              <tr key={visitType.id} className="hover:bg-muted/50 border-b last:border-b-0">
                <td className={cn(tableCellClass, 'font-medium')}>{visitType.name}</td>
                <td className={tableCellClass}>
                  <Badge variant="secondary">{visitType.code}</Badge>
                </td>
                <td className={cn(tableCellClass, 'text-muted-foreground')}>
                  {visitType.description ?? '—'}
                </td>
                <td className={cn(tableCellClass, 'text-right')}>
                  {canEdit || canDelete ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${visitType.name}`}
                        >
                          <PiDotsThreeLight className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit ? (
                          <DropdownMenuItem onSelect={() => onEdit(visitType)}>
                            <CiEdit className="size-4" />
                            Edit
                          </DropdownMenuItem>
                        ) : null}
                        {canDelete ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => onDelete(visitType)}
                          >
                            <CiTrash className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Mirrors VisitTypeTable: the same header and one sized skeleton per cell for a page of rows, plus
// the pagination row the page shows below the table.
export function VisitTypeTableSkeleton({
  canEdit,
  canDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-card overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeadCellClass}>Name</th>
                <th className={tableHeadCellClass}>Code</th>
                <th className={tableHeadCellClass}>Description</th>
                <th className={cn(tableHeadCellClass, 'text-right')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className={tableCellClass}>
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-4 w-48" />
                  </td>
                  <td className={cn(tableCellClass, 'text-right')}>
                    {canEdit || canDelete ? <Skeleton className="ml-auto size-9" /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <Skeleton className="h-4 w-36" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
