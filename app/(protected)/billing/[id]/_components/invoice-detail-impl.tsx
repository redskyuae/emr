'use client';

import { useEffect, useState } from 'react';
import { useQueryState } from 'nuqs';
import { AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import InvoiceDetailLoader from '../loader';

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

  if (invoiceQuery.isLoading) {
    return <InvoiceDetailLoader />;
  }

  if (invoiceQuery.isError || !invoiceQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load the Invoice</AlertTitle>
        <AlertDescription>{getApiErrorMessage(invoiceQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  const invoice = invoiceQuery.data;
  const receiptId = receiptParam && /^\d+$/.test(receiptParam) ? Number(receiptParam) : null;
  const savedPayment = invoice.payments.find((payment) => payment.id === receiptId);
  const receipt =
    receiptSnapshot?.payment.id === receiptId
      ? receiptSnapshot
      : savedPayment
        ? { invoice, payment: savedPayment }
        : null;
  const isDraft = invoice.status === 'DRAFT';
  const canVoid =
    (invoice.status === 'DRAFT' || invoice.status === 'FINALIZED') && invoice.amountPaid === 0;
  const canDelete = invoice.status === 'DRAFT' || invoice.status === 'VOID';

  async function handleRemoveLine(line: InvoiceLine) {
    try {
      await removeMutation.mutateAsync({ id: invoice.id, lineId: line.id });
      toast.success('Line removed.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
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
  );
}
