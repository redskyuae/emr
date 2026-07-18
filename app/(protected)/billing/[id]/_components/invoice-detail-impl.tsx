'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import type { InvoiceLine } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useGenerateBedCharges } from '@/app/queries/billing/invoices/useGenerateBedCharges';
import { useInvoiceQuery } from '@/app/queries/billing/invoices/useInvoice';
import { useRemoveInvoiceLine } from '@/app/queries/billing/invoices/useRemoveInvoiceLine';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DeleteInvoiceDialog } from './_modals/delete-invoice-dialog';
import { FinalizeInvoiceDialog } from './_modals/finalize-invoice-dialog';
import { RecordPaymentDialog } from './_modals/record-payment-dialog';
import { VoidInvoiceDialog } from './_modals/void-invoice-dialog';
import { AddLineSheet } from './_sheets/add-line-sheet';
import { InvoiceHeader } from './invoice-header';
import { InvoiceLinesCard } from './invoice-lines-card';
import { InvoicePaymentsCard } from './invoice-payments-card';
import { InvoiceTotalsPanel } from './invoice-totals-panel';
import InvoiceDetailLoader from '../loader';

type ActiveModal = 'finalize' | 'void' | 'delete' | 'payment' | null;

export function InvoiceDetailImpl({ invoiceId }: { invoiceId: number }) {
  const invoiceQuery = useInvoiceQuery(invoiceId);
  const [lineParam, setLineParam] = useQueryState('line');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const removeMutation = useRemoveInvoiceLine();
  const generateMutation = useGenerateBedCharges();

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

  async function handleGenerateBedCharges() {
    try {
      const result = await generateMutation.mutateAsync(invoice.id);
      toast.success(`Generated ${result.data.linesAdded} bed-day line(s).`);
      for (const warning of result.data.warnings) {
        toast.warning(warning);
      }
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
            {isDraft ? (
              <Button type="button" onClick={() => setActiveModal('finalize')}>
                Finalize
              </Button>
            ) : null}
            {canVoid ? (
              <Button type="button" variant="outline" onClick={() => setActiveModal('void')}>
                Void
              </Button>
            ) : null}
            {canDelete ? (
              <Button type="button" variant="outline" onClick={() => setActiveModal('delete')}>
                Delete
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <InvoiceLinesCard
            invoice={invoice}
            onAddLine={() => void setLineParam('new')}
            onRemoveLine={(line) => void handleRemoveLine(line)}
            onGenerateBedCharges={() => void handleGenerateBedCharges()}
            isRemoving={removeMutation.isPending}
            isGenerating={generateMutation.isPending}
          />
          <InvoicePaymentsCard
            invoice={invoice}
            onRecordPayment={() => setActiveModal('payment')}
          />
        </div>

        <InvoiceTotalsPanel invoice={invoice} />
      </div>

      <AddLineSheet
        invoiceId={invoice.id}
        open={lineParam === 'new'}
        onClose={() => void setLineParam(null)}
      />
      <FinalizeInvoiceDialog
        invoice={invoice}
        open={activeModal === 'finalize'}
        onClose={() => setActiveModal(null)}
      />
      <VoidInvoiceDialog
        invoice={invoice}
        open={activeModal === 'void'}
        onClose={() => setActiveModal(null)}
      />
      <DeleteInvoiceDialog
        invoice={invoice}
        open={activeModal === 'delete'}
        onClose={() => setActiveModal(null)}
      />
      <RecordPaymentDialog
        invoice={invoice}
        open={activeModal === 'payment'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
