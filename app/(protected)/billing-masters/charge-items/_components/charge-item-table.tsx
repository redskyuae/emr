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
import {
  tableCellClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from '@/components/ui/table-styles';
import { cn } from '@/lib/utils';
import { formatUnitPrice, getChargeItemCategoryLabel } from '../_utils/charge-item-category';
import { getChargeItemCodeTypeDetails } from '../_utils/charge-item-code-type';

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
            <tr className={tableHeadRowClass}>
              <th className={tableHeadCellClass}>Service Name</th>
              <th className={tableHeadCellClass}>Code</th>
              <th className={tableHeadCellClass}>Category</th>
              <th className={cn(tableHeadCellClass, 'text-right')}>Standard</th>
              <th className={cn(tableHeadCellClass, 'text-right')}>Cash</th>
              <th className={cn(tableHeadCellClass, 'text-right')}>Insurance</th>
              <th className={tableHeadCellClass}>Effective</th>
              <th className={tableHeadCellClass}>Free follow-up</th>
              <th className={tableHeadCellClass}>Status</th>
              <th className={cn(tableHeadCellClass, 'text-right')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {chargeItems.map((chargeItem) => (
              <tr key={chargeItem.id} className="hover:bg-muted/50 border-b last:border-b-0">
                <td className={cn(tableCellClass, 'font-medium')}>
                  {chargeItem.name}
                  {chargeItem.description ? (
                    <span className="text-muted-foreground block max-w-64 truncate text-xs font-normal">
                      {chargeItem.description}
                    </span>
                  ) : null}
                </td>
                <td className={tableCellClass}>
                  <span className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="font-mono">
                      {chargeItem.code}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-muted-foreground"
                      title={getChargeItemCodeTypeDetails(chargeItem.codeType).label}
                    >
                      {getChargeItemCodeTypeDetails(chargeItem.codeType).badge}
                    </Badge>
                  </span>
                </td>
                <td className={cn(tableCellClass, 'text-muted-foreground')}>
                  {getChargeItemCategoryLabel(chargeItem.category)}
                </td>
                <td className={cn(tableCellClass, 'text-right tabular-nums')}>
                  {formatUnitPrice(chargeItem.unitPrice)}
                </td>
                <td className={cn(tableCellClass, 'text-right tabular-nums')}>
                  {chargeItem.cashPrice === null ? '—' : formatUnitPrice(chargeItem.cashPrice)}
                </td>
                <td className={cn(tableCellClass, 'text-right tabular-nums')}>
                  {chargeItem.insuranceContractPrice === null
                    ? '—'
                    : formatUnitPrice(chargeItem.insuranceContractPrice)}
                </td>
                <td className={cn(tableCellClass, 'font-mono text-xs')}>
                  {chargeItem.effectiveDate ?? '—'}
                </td>
                <td className={tableCellClass}>
                  {chargeItem.freeFollowUpEligible ? 'Eligible' : '—'}
                </td>
                <td className={tableCellClass}>
                  {chargeItem.isActive ? (
                    <Badge variant="outline">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </td>
                <td className={cn(tableCellClass, 'text-right')}>
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
