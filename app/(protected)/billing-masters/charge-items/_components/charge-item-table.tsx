'use client';

import { CiEdit, CiTrash } from 'react-icons/ci';
import { PiDotsThreeLight } from 'react-icons/pi';

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
    <div className="bg-card overflow-hidden rounded-xl border">
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
                          <PiDotsThreeLight className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit ? (
                          <DropdownMenuItem onSelect={() => onEdit(chargeItem)}>
                            <CiEdit className="size-4" />
                            Edit
                          </DropdownMenuItem>
                        ) : null}
                        {canDelete ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => onDelete(chargeItem)}
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

// Mirrors ChargeItemTable: the same header and one sized skeleton per cell for a page of rows,
// plus the pagination row the page shows below the table.
export function ChargeItemTableSkeleton({
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
              {Array.from({ length: 10 }, (_, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className={tableCellClass}>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-1.5 h-3 w-48" />
                  </td>
                  <td className={tableCellClass}>
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className={cn(tableCellClass, 'text-right')}>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </td>
                  <td className={cn(tableCellClass, 'text-right')}>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </td>
                  <td className={cn(tableCellClass, 'text-right')}>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-4 w-14" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-6 w-14 rounded-full" />
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
