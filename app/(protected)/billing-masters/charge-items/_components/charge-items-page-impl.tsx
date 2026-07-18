'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, ChevronLeft, ChevronRight, Plus, ReceiptText, Search } from 'lucide-react';

import type { ChargeItem } from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useChargeItemsQuery } from '@/app/queries/billing/charge-items/useChargeItems';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CHARGE_ITEM_CATEGORY_OPTIONS } from '../_utils/charge-item-category';
import { DeleteChargeItemDialog } from './_modals/delete-charge-item-dialog';
import { ChargeItemFormSheet } from './_sheets/charge-item-form-sheet';
import { ChargeItemTable, ChargeItemTableSkeleton } from './charge-item-table';

const PAGE_SIZE = 10;
const ALL_CATEGORIES = 'all';

export function ChargeItemsPageImpl() {
  const [chargeItemParam, setChargeItemParam] = useQueryState('charge-item');
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [chargeItemPendingDelete, setChargeItemPendingDelete] = useState<ChargeItem | null>(null);

  const chargeItemsQuery = useChargeItemsQuery({
    query: debouncedSearch || undefined,
    category: categoryFilter !== ALL_CATEGORIES ? categoryFilter : undefined,
    page,
    limit: PAGE_SIZE,
  });

  const chargeItems = chargeItemsQuery.data?.data ?? [];
  const meta = chargeItemsQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const isFiltered = Boolean(debouncedSearch) || categoryFilter !== ALL_CATEGORIES;

  // The sheet opens straight from the URL: ?charge-item=new creates,
  // ?charge-item=<id> edits once the row resolves from already-loaded query data.
  const isCreating = chargeItemParam === 'new';
  const editingId =
    chargeItemParam !== null && chargeItemParam !== 'new' && /^\d+$/.test(chargeItemParam)
      ? Number(chargeItemParam)
      : null;
  const editingChargeItem =
    editingId !== null ? (chargeItems.find((row) => row.id === editingId) ?? null) : null;
  const sheetOpen = isCreating || (editingId !== null && editingChargeItem !== null);

  function closeSheet() {
    void setChargeItemParam(null);
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
            <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-sm">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Search charge items..."
                aria-label="Search charge items"
              />
            </InputGroup>

            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-48" aria-label="Filter by category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>All Categories</SelectItem>
                {CHARGE_ITEM_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" onClick={() => void setChargeItemParam('new')}>
                <Plus className="size-4" />
                Add Charge Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {chargeItemsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Charge Items</AlertTitle>
            <AlertDescription>{getApiErrorMessage(chargeItemsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {chargeItemsQuery.isLoading ? (
          <ChargeItemTableSkeleton />
        ) : chargeItems.length === 0 && !isFiltered ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptText />
              </EmptyMedia>
              <EmptyTitle>No Charge Items yet</EmptyTitle>
              <EmptyDescription>
                Build your priced catalogue of consultations, procedures, investigations and
                consumables so cashiers can add them to Invoices.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setChargeItemParam('new')}>
                <Plus className="size-4" />
                Add Charge Item
              </Button>
            </EmptyContent>
          </Empty>
        ) : chargeItems.length === 0 ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Charge Items match the current filters. Try a different search term or category.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <ChargeItemTable
              chargeItems={chargeItems}
              onEdit={(chargeItem) => void setChargeItemParam(String(chargeItem.id))}
              onDelete={setChargeItemPendingDelete}
            />

            {totalPages > 0 ? (
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-muted-foreground text-sm">
                  Showing {rangeStart}&ndash;{rangeEnd} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <ChargeItemFormSheet
        open={sheetOpen}
        chargeItem={editingChargeItem}
        isCreating={isCreating}
        onClose={closeSheet}
      />

      <DeleteChargeItemDialog
        chargeItem={chargeItemPendingDelete}
        onClose={() => setChargeItemPendingDelete(null)}
      />
    </>
  );
}
