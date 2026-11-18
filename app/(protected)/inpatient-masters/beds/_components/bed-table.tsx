'use client';

import { CiEdit, CiTrash } from 'react-icons/ci';
import { PiDotsThreeLight } from 'react-icons/pi';

import type { Bed } from '@/app/api/lib/modules/bed/schemas/bed-schema';
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
import { getBedStatusClassName, getBedStatusLabel } from '../_utils/bed-status';

export function BedTable({
  beds,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  beds: Bed[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (bed: Bed) => void;
  onDelete: (bed: Bed) => void;
}) {
  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeadCellClass}>Bed</th>
              <th className={tableHeadCellClass}>Ward</th>
              <th className={tableHeadCellClass}>Room</th>
              <th className={tableHeadCellClass}>Status</th>
              <th className={tableHeadCellClass}>Notes</th>
              <th className={cn(tableHeadCellClass, 'text-right')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {beds.map((bed) => (
              <tr key={bed.id} className="hover:bg-muted/50 border-b last:border-b-0">
                <td className={cn(tableCellClass, 'font-medium')}>{bed.bedNumber}</td>
                <td className={tableCellClass}>
                  {bed.ward.name} <Badge variant="secondary">{bed.ward.code}</Badge>
                </td>
                <td className={cn(tableCellClass, 'text-muted-foreground')}>
                  {bed.room?.roomNumber ?? '—'}
                </td>
                <td className={tableCellClass}>
                  <Badge variant="outline" className={getBedStatusClassName(bed.status)}>
                    {getBedStatusLabel(bed.status)}
                  </Badge>
                </td>
                <td className={cn(tableCellClass, 'text-muted-foreground max-w-56 truncate')}>
                  {bed.notes ?? '—'}
                </td>
                <td className={cn(tableCellClass, 'text-right')}>
                  {canEdit || canDelete ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${bed.bedNumber}`}
                        >
                          <PiDotsThreeLight className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit ? (
                          <DropdownMenuItem onSelect={() => onEdit(bed)}>
                            <CiEdit className="size-4" />
                            Edit
                          </DropdownMenuItem>
                        ) : null}
                        {canDelete ? (
                          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(bed)}>
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

// Mirrors BedTable: the same header and one sized skeleton per cell for a page of rows, plus the
// pagination row the page shows below the table.
export function BedTableSkeleton({ canEdit, canDelete }: { canEdit: boolean; canDelete: boolean }) {
  return (
    <div className="space-y-4">
      <div className="bg-card overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeadCellClass}>Bed</th>
                <th className={tableHeadCellClass}>Ward</th>
                <th className={tableHeadCellClass}>Room</th>
                <th className={tableHeadCellClass}>Status</th>
                <th className={tableHeadCellClass}>Notes</th>
                <th className={cn(tableHeadCellClass, 'text-right')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className={tableCellClass}>
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className={tableCellClass}>
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>
                  <td className={cn(tableCellClass, 'max-w-56')}>
                    <Skeleton className="h-4 w-40" />
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
