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
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  chargeItems: ChargeItem[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (chargeItem: ChargeItem) => void;
  onDelete: (chargeItem: ChargeItem) => void;
}) {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="text-muted-foreground bg-muted/60 border-b text-left text-xs tracking-wider uppercase">
              <th className="p-3 pl-5 font-semibold">Service Name</th>
              <th className="p-3 font-semibold">CPT / Service Code</th>
              <th className="p-3 font-semibold">Category</th>
              <th className="p-3 text-right font-semibold">Standard</th>
              <th className="p-3 text-right font-semibold">Cash</th>
              <th className="p-3 text-right font-semibold">Insurance</th>
              <th className="p-3 font-semibold">Effective</th>
              <th className="p-3 font-semibold">Free follow-up</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 pr-5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {chargeItems.map((chargeItem) => (
              <tr key={chargeItem.id} className="hover:bg-muted/50 border-b last:border-b-0">
                <td className="px-3 py-3.5 pl-5 font-medium">
                  {chargeItem.name}
                  {chargeItem.description ? (
                    <span className="text-muted-foreground block max-w-64 truncate text-xs font-normal">
                      {chargeItem.description}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3.5">
                  <Badge variant="secondary">{chargeItem.code}</Badge>
                </td>
                <td className="text-muted-foreground px-3 py-3.5">
                  {getChargeItemCategoryLabel(chargeItem.category)}
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums">
                  {formatUnitPrice(chargeItem.unitPrice)}
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums">
                  {chargeItem.cashPrice === null ? '—' : formatUnitPrice(chargeItem.cashPrice)}
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums">
                  {chargeItem.insuranceContractPrice === null
                    ? '—'
                    : formatUnitPrice(chargeItem.insuranceContractPrice)}
                </td>
                <td className="px-3 py-3.5 font-mono text-xs">{chargeItem.effectiveDate ?? '—'}</td>
                <td className="px-3 py-3.5">
                  {chargeItem.freeFollowUpEligible ? 'Eligible' : '—'}
                </td>
                <td className="px-3 py-3.5">
                  {chargeItem.isActive ? (
                    <Badge variant="outline">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-3.5 pr-5 text-right">
                  {canEdit || canDelete ? (
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
                        {canEdit ? (
                          <DropdownMenuItem onSelect={() => onEdit(chargeItem)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                        ) : null}
                        {canDelete ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => onDelete(chargeItem)}
                          >
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

export function ChargeItemTableSkeleton() {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-xl border p-4">
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
