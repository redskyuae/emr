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

export function WardTable({
  wards,
  onEdit,
  onDelete,
}: {
  wards: Ward[];
  onEdit: (ward: Ward) => void;
  onDelete: (ward: Ward) => void;
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
            {wards.map((ward) => (
              <tr key={ward.id} className="hover:bg-muted/50 border-b last:border-b-0">
                <td className="p-3 pl-4 font-medium">{ward.name}</td>
                <td className="p-3">
                  <Badge variant="secondary">{ward.code}</Badge>
                </td>
                <td className="text-muted-foreground p-3">{ward.description ?? '—'}</td>
                <td className="p-3 pr-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions for ${ward.name}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onEdit(ward)}>
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => onDelete(ward)}>
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

export function WardTableSkeleton() {
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
