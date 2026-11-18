'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import type { Ward } from '@/app/api/lib/modules/ward/schemas/ward-schema';
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

export function WardTable({
  wards,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  wards: Ward[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (ward: Ward) => void;
  onDelete: (ward: Ward) => void;
}) {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-xl border">
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
            {wards.map((ward) => (
              <tr key={ward.id} className="hover:bg-muted/50 border-b last:border-b-0">
                <td className={cn(tableCellClass, 'font-medium')}>{ward.name}</td>
                <td className={tableCellClass}>
                  <Badge variant="secondary">{ward.code}</Badge>
                </td>
                <td className={cn(tableCellClass, 'text-muted-foreground')}>
                  {ward.description ?? '—'}
                </td>
                <td className={cn(tableCellClass, 'text-right')}>
                  {canEdit || canDelete ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${ward.name}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit ? (
                          <DropdownMenuItem onSelect={() => onEdit(ward)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                        ) : null}
                        {canDelete ? (
                          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(ward)}>
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

export function WardTableSkeleton() {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-xl border p-4">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="size-8" />
        </div>
      ))}
    </div>
  );
}
