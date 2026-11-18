'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

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
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left">
              <th className="p-3 pl-4 font-medium">Bed</th>
              <th className="p-3 font-medium">Ward</th>
              <th className="p-3 font-medium">Room</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Notes</th>
              <th className="p-3 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {beds.map((bed) => (
              <tr key={bed.id} className="hover:bg-muted/50 border-b last:border-b-0">
                <td className="p-3 pl-4 font-medium">{bed.bedNumber}</td>
                <td className="p-3">
                  {bed.ward.name} <Badge variant="secondary">{bed.ward.code}</Badge>
                </td>
                <td className="text-muted-foreground p-3">{bed.room?.roomNumber ?? '—'}</td>
                <td className="p-3">
                  <Badge variant="outline" className={getBedStatusClassName(bed.status)}>
                    {getBedStatusLabel(bed.status)}
                  </Badge>
                </td>
                <td className="text-muted-foreground max-w-56 truncate p-3">{bed.notes ?? '—'}</td>
                <td className="p-3 pr-4 text-right">
                  {canEdit || canDelete ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${bed.bedNumber}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit ? (
                          <DropdownMenuItem onSelect={() => onEdit(bed)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                        ) : null}
                        {canDelete ? (
                          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(bed)}>
                            <Trash2 className="size-4" />
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

export function BedTableSkeleton() {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border p-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="size-8" />
        </div>
      ))}
    </div>
  );
}
