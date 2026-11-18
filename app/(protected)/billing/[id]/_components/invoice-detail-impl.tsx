'use client';

import { useEffect, useState } from 'react';
import { useQueryState } from 'nuqs';
import { CiCircleAlert } from 'react-icons/ci';
import { toast } from 'sonner';

import type {
  Invoice,
  InvoiceLine,
  Payment,
} from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useInvoiceQuery } from '@/app/queries/billing/invoices/useInvoice';
import { useRemoveInvoiceLine } from '@/app/queries/billing/invoices/useRemoveInvoiceLine';
import {
  useCurrentUserQuery,
  useHasPermission,
} from '@/app/queries/identity-access/useCurrentUser';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  tableCellClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from '@/components/ui/table-styles';
import { cn } from '@/lib/utils';
import { DeleteInvoiceDialog } from './_modals/delete-invoice-dialog';
import { FinalizeInvoiceDialog } from './_modals/finalize-invoice-dialog';
import { GenerateBedChargesDialog } from './_modals/generate-bed-charges-dialog';
import { PaymentReceiptDialog } from './_modals/payment-receipt-dialog';
import { RecordPaymentDialog } from './_modals/record-payment-dialog';
import { VoidInvoiceDialog } from './_modals/void-invoice-dialog';
import { AddLineSheet } from './_sheets/add-line-sheet';
import { InvoiceHeader } from './invoice-header';
import { InvoiceLinesCard } from './invoice-lines-card';
import { InvoicePaymentsCard } from './invoice-payments-card';
import { InvoicePatientCard } from './invoice-patient-card';
import { InvoiceTotalsPanel } from './invoice-totals-panel';

type ActiveModal = 'finalize' | 'void' | 'delete' | 'payment' | 'generate-bed-charges' | null;
type RecordedReceipt = { invoice: Invoice; payment: Payment };

export function InvoiceDetailImpl({ invoiceId }: { invoiceId: number }) {
  const invoiceQuery = useInvoiceQuery(invoiceId);
  const [lineParam, setLineParam] = useQueryState('line');
  const [receiptParam, setReceiptParam] = useQueryState('receipt');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [receiptSnapshot, setReceiptSnapshot] = useState<RecordedReceipt | null>(null);
  const removeMutation = useRemoveInvoiceLine();
  const currentUserQuery = useCurrentUserQuery();

  const {
    data: canUpdateInvoice,
    isLoading: canUpdateLoading,
    isError: canUpdateError,
  } = useHasPermission('invoice:update');
  const { data: canFinalizeInvoice } = useHasPermission('invoice:finalize');
  const { data: canVoidInvoice } = useHasPermission('invoice:void');
  const { data: canDeleteInvoice } = useHasPermission('invoice:delete');
  const { data: canGenerateCharges } = useHasPermission('invoice:generate-charges');
  const { data: canRecordPayment } = useHasPermission('payment:record');

  const lineAccessDenied =
    lineParam === 'new' && !canUpdateLoading && !canUpdateError && !canUpdateInvoice;

  useEffect(() => {
    if (lineAccessDenied) {
      void setLineParam(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineAccessDenied]);

  if (invoiceQuery.isError || (!invoiceQuery.isLoading && !invoiceQuery.data)) {
    return (
      <Alert variant="destructive">
        <CiCircleAlert className="size-4" />
        <AlertTitle>Could not load the Invoice</AlertTitle>
        <AlertDescription>{getApiErrorMessage(invoiceQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  const invoice = invoiceQuery.data;
  const receiptId = receiptParam && /^\d+$/.test(receiptParam) ? Number(receiptParam) : null;
  const savedPayment = invoice?.payments.find((payment) => payment.id === receiptId);
  const receipt =
    receiptSnapshot?.payment.id === receiptId
      ? receiptSnapshot
      : invoice && savedPayment
        ? { invoice, payment: savedPayment }
        : null;
  const isDraft = invoice?.status === 'DRAFT';
  const canVoid =
    (invoice?.status === 'DRAFT' || invoice?.status === 'FINALIZED') && invoice.amountPaid === 0;
  const canDelete = invoice?.status === 'DRAFT' || invoice?.status === 'VOID';

  async function handleRemoveLine(line: InvoiceLine) {
    if (!invoice) {
      return;
    }

    try {
      await removeMutation.mutateAsync({ id: invoice.id, lineId: line.id });
      toast.success('Line removed.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <SkeletonCrossfade isLoading={invoiceQuery.isLoading} skeleton={<InvoiceDetailSkeleton />}>
      {invoice ? (
        <div className="space-y-4">
          <InvoiceHeader
            invoice={invoice}
            actions={
              <>
                {isDraft && canFinalizeInvoice ? (
                  <Button type="button" onClick={() => setActiveModal('finalize')}>
                    Finalize
                  </Button>
                ) : null}
                {canVoid && canVoidInvoice ? (
                  <Button type="button" variant="outline" onClick={() => setActiveModal('void')}>
                    Void
                  </Button>
                ) : null}
                {canDelete && canDeleteInvoice ? (
                  <Button type="button" variant="outline" onClick={() => setActiveModal('delete')}>
                    Delete
                  </Button>
                ) : null}
              </>
            }
          />

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-4">
              <InvoicePatientCard invoice={invoice} />
              <InvoiceLinesCard
                invoice={invoice}
                onAddLine={() => void setLineParam('new')}
                onRemoveLine={(line) => void handleRemoveLine(line)}
                onGenerateBedCharges={() => setActiveModal('generate-bed-charges')}
                isRemoving={removeMutation.isPending}
                canUpdate={canUpdateInvoice}
                canGenerateCharges={canGenerateCharges}
              />
            </div>
            <div className="space-y-4">
              <InvoiceTotalsPanel invoice={invoice} />
              {(invoice.status === 'FINALIZED' || invoice.status === 'PARTIALLY_PAID') &&
              canRecordPayment ? (
                <Button type="button" className="w-full" onClick={() => setActiveModal('payment')}>
                  Record Payment
                </Button>
              ) : null}
            </div>
          </div>

          <InvoicePaymentsCard
            invoice={invoice}
            onRecordPayment={() => setActiveModal('payment')}
            onViewReceipt={(payment) => {
              setReceiptSnapshot(null);
              void setReceiptParam(String(payment.id));
            }}
            canRecordPayment={canRecordPayment}
          />

          <AddLineSheet
            invoiceId={invoice.id}
            open={lineParam === 'new' && canUpdateInvoice}
            onClose={() => void setLineParam(null)}
          />
          <FinalizeInvoiceDialog
            invoice={invoice}
            open={activeModal === 'finalize' && canFinalizeInvoice}
            onClose={() => setActiveModal(null)}
          />
          <VoidInvoiceDialog
            invoice={invoice}
            open={activeModal === 'void' && canVoidInvoice}
            onClose={() => setActiveModal(null)}
          />
          <DeleteInvoiceDialog
            invoice={invoice}
            open={activeModal === 'delete' && canDeleteInvoice}
            onClose={() => setActiveModal(null)}
          />
          <RecordPaymentDialog
            invoice={invoice}
            open={activeModal === 'payment' && canRecordPayment}
            onClose={() => setActiveModal(null)}
            onRecorded={(recordedReceipt) => {
              setReceiptSnapshot(recordedReceipt);
              void setReceiptParam(String(recordedReceipt.payment.id));
            }}
          />
          {receipt ? (
            <PaymentReceiptDialog
              open
              invoice={receipt.invoice}
              payment={receipt.payment}
              tenantName={currentUserQuery.data?.tenant.name ?? receipt.invoice.tenantId}
              timeZone={currentUserQuery.data?.tenant.timeZone ?? 'UTC'}
              onClose={() => {
                setReceiptSnapshot(null);
                void setReceiptParam(null);
              }}
            />
          ) : null}
          <GenerateBedChargesDialog
            invoice={invoice}
            open={activeModal === 'generate-bed-charges' && canGenerateCharges}
            onClose={() => setActiveModal(null)}
          />
        </div>
      ) : null}
    </SkeletonCrossfade>
  );
}

function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading Invoice">
      <InvoiceHeaderSkeleton />
      <InvoiceDetailBodySkeleton />
    </div>
  );
}

// The header card: back button, Invoice number and status, the "Invoice for" line, actions.
function InvoiceHeaderSkeleton() {
  return (
    <div className="bg-card flex flex-col gap-4 rounded-xl border p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Skeleton className="size-9" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="pl-11">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-11 lg:pl-0">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}

// Everything under the header: the Patient & encounter and Charges cards beside the Summary
// panel, then the Payments card. Both tables keep their real columns; the line-removal
// column and card actions depend on the Invoice's status, so they are left out.
export function InvoiceDetailBodySkeleton() {
  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patient &amp; encounter</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">Patient</p>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">Encounter</p>
                <Skeleton className="h-4 w-28" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Charges</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className={cn(tableHeadRowClass, 'border-y')}>
                      <th className={tableHeadCellClass}>Description</th>
                      <th className={cn(tableHeadCellClass, 'text-right')}>Qty</th>
                      <th className={cn(tableHeadCellClass, 'text-right')}>Unit Price</th>
                      <th className={cn(tableHeadCellClass, 'text-right')}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2].map((row) => (
                      <tr key={row} className="border-b last:border-b-0">
                        <td className={tableCellClass}>
                          <Skeleton className="h-4 w-48" />
                        </td>
                        <td className={tableCellClass}>
                          <Skeleton className="ml-auto h-4 w-6" />
                        </td>
                        <td className={tableCellClass}>
                          <Skeleton className="ml-auto h-4 w-20" />
                        </td>
                        <td className={tableCellClass}>
                          <Skeleton className="ml-auto h-4 w-20" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {['Subtotal', 'Discount'].map((label) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-muted-foreground">{label}</span>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-3 font-medium">
              <span>Grand total</span>
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amount paid</span>
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Balance due</span>
              <Skeleton className="h-5 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className={cn(tableHeadRowClass, 'border-y')}>
                  <th className={tableHeadCellClass}>Receipt</th>
                  <th className={tableHeadCellClass}>Method</th>
                  <th className={tableHeadCellClass}>Reference</th>
                  <th className={cn(tableHeadCellClass, 'text-right')}>Amount</th>
                  <th className={tableHeadCellClass}>Received</th>
                  <th className={cn(tableHeadCellClass, 'text-right')}>Receipt action</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1].map((row) => (
                  <tr key={row} className="border-b last:border-b-0">
                    <td className={tableCellClass}>
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className={tableCellClass}>
                      <Skeleton className="h-4 w-14" />
                    </td>
                    <td className={tableCellClass}>
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className={tableCellClass}>
                      <Skeleton className="ml-auto h-4 w-20" />
                    </td>
                    <td className={tableCellClass}>
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className={tableCellClass}>
                      <Skeleton className="ml-auto h-8 w-16" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
