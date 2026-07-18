'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import type { ChargeItem } from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUnitPrice, getChargeItemCategoryLabel } from '../_utils/charge-item-category';

export function ChargeItemTable({
  chargeItems,
  onEdit,
  onDelete,
}: {
  chargeItems: ChargeItem[];
  onEdit: (chargeItem: ChargeItem) => void;
  onDelete: (chargeItem: ChargeItem) => void;
}) {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left">
              <th className="p-3 pl-4 font-medium">Charge Item</th>
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 text-right font-medium">Unit Price</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {chargeItems.map((chargeItem) => (
              <tr key={chargeItem.id} className="hover:bg-muted/50 border-b last:border-b-0">
                <td className="p-3 pl-4 font-medium">
                  {chargeItem.name}
                  {chargeItem.description ? (
                    <span className="text-muted-foreground block max-w-64 truncate text-xs font-normal">
                      {chargeItem.description}
                    </span>
                  ) : null}
                </td>
                <td className="p-3">
                  <Badge variant="secondary">{chargeItem.code}</Badge>
                </td>
                <td className="text-muted-foreground p-3">
                  {getChargeItemCategoryLabel(chargeItem.category)}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {formatUnitPrice(chargeItem.unitPrice)}
                </td>
                <td className="p-3">
                  {chargeItem.isActive ? (
                    <Badge variant="outline">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </td>
                <td className="p-3 pr-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions for ${chargeItem.name}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onEdit(chargeItem)}>
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => onDelete(chargeItem)}>
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

export function ChargeItemTableSkeleton() {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border p-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="ml-auto h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="size-8" />
        </div>
      ))}
    </div>
  );
}
