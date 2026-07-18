'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, ChevronLeft, ChevronRight, Plus, ReceiptText, Search } from 'lucide-react';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useInvoicesQuery } from '@/app/queries/billing/invoices/useInvoices';
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
import { OPEN_INVOICE_STATUSES } from '../_utils/invoice-display';
import { CreateInvoiceSheet } from './_sheets/create-invoice-sheet';
import { InvoiceTable, InvoiceTableSkeleton } from './invoice-table';

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: 'open', label: 'Open', param: OPEN_INVOICE_STATUSES },
  { value: 'all', label: 'All', param: undefined },
  { value: 'draft', label: 'Draft', param: 'DRAFT' },
  { value: 'finalized', label: 'Finalized', param: 'FINALIZED' },
  { value: 'partially_paid', label: 'Partially Paid', param: 'PARTIALLY_PAID' },
  { value: 'paid', label: 'Paid', param: 'PAID' },
  { value: 'void', label: 'Void', param: 'VOID' },
] as const;

export function BillingPageImpl() {
  const [invoiceParam] = useQueryState('invoice');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const statusParam = STATUS_FILTERS.find((option) => option.value === statusFilter)?.param;
  const invoicesQuery = useInvoicesQuery({
    query: debouncedSearch || undefined,
    status: statusParam,
    page,
    limit: PAGE_SIZE,
  });

  const invoices = invoicesQuery.data?.data ?? [];
  const meta = invoicesQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const isFiltered = Boolean(debouncedSearch) || statusFilter !== 'open';

  const sheetOpen = invoiceParam === 'new';

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
                placeholder="Search invoice # / patient / MRN..."
                aria-label="Search invoices"
              />
            </InputGroup>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-48" aria-label="Filter by status">
                <SelectValue placeholder="Open" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button asChild>
                <Link href="/billing?invoice=new">
                  <Plus className="size-4" />
                  New Invoice
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {invoicesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Invoices</AlertTitle>
            <AlertDescription>{getApiErrorMessage(invoicesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {invoicesQuery.isLoading ? (
          <InvoiceTableSkeleton />
        ) : invoices.length === 0 && !isFiltered ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptText />
              </EmptyMedia>
              <EmptyTitle>No Invoices yet</EmptyTitle>
              <EmptyDescription>
                Raise a bill for a Patient, optionally linked to a Visit or Admission, then add
                priced Charge Items to it.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/billing?invoice=new">
                  <Plus className="size-4" />
                  New Invoice
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : invoices.length === 0 ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Invoices match the current filters. Try a different search term or status.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <InvoiceTable invoices={invoices} />

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

      <CreateInvoiceSheet open={sheetOpen} />
    </>
  );
}
