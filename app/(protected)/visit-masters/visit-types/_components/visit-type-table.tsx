'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

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

export function VisitTypeTable({
  visitTypes,
  onEdit,
  onDelete,
}: {
  visitTypes: VisitType[];
  onEdit: (visitType: VisitType) => void;
  onDelete: (visitType: VisitType) => void;
}) {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left">
              <th className="p-3 pl-4 font-medium">Name</th>
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Description</th>
              <th className="p-3 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visitTypes.map((visitType) => (
              <tr key={visitType.id} className="hover:bg-muted/50 border-b last:border-b-0">
                <td className="p-3 pl-4 font-medium">{visitType.name}</td>
                <td className="p-3">
                  <Badge variant="secondary">{visitType.code}</Badge>
                </td>
                <td className="text-muted-foreground p-3">{visitType.description ?? '—'}</td>
                <td className="p-3 pr-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions for ${visitType.name}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onEdit(visitType)}>
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => onDelete(visitType)}>
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function VisitTypeTableSkeleton() {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border p-3">
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
