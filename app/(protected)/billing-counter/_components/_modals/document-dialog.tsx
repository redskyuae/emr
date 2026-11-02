'use client';

import { useRef } from 'react';
import { format } from 'date-fns';
import { Mail, MessageCircle, Printer } from 'lucide-react';
import { toast } from 'sonner';

import { useCurrentUserQuery } from '@/app/queries/identity-access/useCurrentUser';
import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { COUNTER_ENTITY } from '../../_data/counter-seed';
import { formatAed } from '../../_utils/money';
import type { LedgerTxn } from '../../_utils/counter-types';
import { TENDER_META, describeTender } from '../../_utils/tender';
import { useCounter } from '../counter-state';

const TITLES = {
  INVOICE: { en: 'Tax Invoice', ar: 'فاتورة ضريبية', dialog: 'Tax invoice & receipt' },
  ADVANCE: { en: 'Advance Receipt', ar: 'إيصال دفعة مقدمة', dialog: 'Advance receipt' },
  CREDIT_NOTE: { en: 'Tax Credit Note', ar: 'إشعار دائن ضريبي', dialog: 'Credit note' },
} as const;

// The preview is printed from a hidden frame so the app chrome never prints
// with it; the frame borrows the page's stylesheets to keep the same look.
function printPreview(node: HTMLElement) {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);

  const frameDocument = frame.contentDocument;

  if (!frameDocument) {
    frame.remove();
    return;
  }

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((element) => element.outerHTML)
    .join('');

  frameDocument.open();
  frameDocument.write(
    `<html><head>${styles}</head><body class="p-6">${node.outerHTML}</body></html>`
  );
  frameDocument.close();
  frame.onload = () => {
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  };
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-6 ${strong ? 'font-semibold' : ''}`}>
      <dt className={strong ? undefined : 'text-muted-foreground'}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function DocumentBody({
  txn,
  advanceBalance,
  tenantName,
}: {
  txn: LedgerTxn;
  advanceBalance: number;
  tenantName: string;
}) {
  const title = TITLES[txn.type];
  const isCredit = txn.type === 'CREDIT_NOTE';
  const sign = isCredit ? -1 : 1;
  const cashTender = txn.tenders.find((tender) => tender.method === 'CASH');

  return (
    <div className="bg-card space-y-4 rounded-md border p-5 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <LogoMark className="size-10" />
          <div className="min-w-0">
            <p className="font-heading text-lg leading-tight font-semibold">{tenantName}</p>
            <p className="text-muted-foreground text-xs">Medical EMR · Billing Counter</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-heading text-lg font-semibold">{title.en}</p>
          <p className="text-muted-foreground text-xs" dir="rtl">
            {title.ar}
          </p>
          <p className="font-mono text-xs font-semibold">{txn.number}</p>
          <p className="text-muted-foreground text-xs">
            {format(new Date(), 'dd-MMM-yyyy')}, {txn.time}
          </p>
        </div>
      </div>

      <div className="grid gap-3 border-t pt-3 sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-xs">Patient</p>
          <p className="font-semibold">{txn.patientName}</p>
          <p className="text-xs">MRN {txn.patientMrn}</p>
          {txn.visitNumber ? <p className="text-xs">Visit {txn.visitNumber}</p> : null}
        </div>
        {isCredit ? (
          <div>
            <p className="text-muted-foreground text-xs">Against</p>
            <p className="font-semibold">{txn.against}</p>
            <p className="text-muted-foreground text-xs">Reason</p>
            <p className="text-xs">
              {txn.reason} · approved by {txn.approvedBy}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground text-xs">Supply date</p>
            <p className="text-xs">{format(new Date(), 'dd-MMM-yyyy')}</p>
            <p className="text-muted-foreground text-xs">Clinic</p>
            <p className="text-xs">{tenantName}</p>
          </div>
        )}
      </div>

      {txn.type === 'INVOICE' && txn.lines.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-y text-right">
                <th className="py-1.5 text-left font-medium">Description</th>
                <th className="py-1.5 font-medium">Qty</th>
                <th className="py-1.5 font-medium">Unit</th>
                <th className="py-1.5 font-medium">Disc.</th>
                <th className="py-1.5 font-medium">Taxable</th>
                <th className="py-1.5 font-medium">VAT %</th>
                <th className="py-1.5 font-medium">VAT</th>
                <th className="py-1.5 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {txn.lines.map((line, index) => (
                <tr key={`${line.code}-${index}`} className="border-b text-right">
                  <td className="py-1.5 text-left">{line.description}</td>
                  <td>{line.quantity}</td>
                  <td>{formatAed(line.unitPrice)}</td>
                  <td>
                    {line.discountPercent > 0 ? `${line.discountPercent}% · ` : ''}
                    {formatAed(line.discount)}
                  </td>
                  <td>{formatAed(line.taxable)}</td>
                  <td>{line.vatRate}</td>
                  <td>{formatAed(line.vat)}</td>
                  <td>{formatAed(line.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : txn.type === 'INVOICE' ? (
        <p className="text-xs">{txn.description}</p>
      ) : null}

      <dl className="ml-auto max-w-xs space-y-0.5 text-xs">
        <Row
          label={isCredit ? 'Amount excl. VAT' : 'Taxable amount'}
          value={formatAed(Math.abs(txn.taxable))}
        />
        <Row
          label={
            isCredit ? `VAT ${COUNTER_ENTITY.vatRate}% adjusted` : `VAT ${COUNTER_ENTITY.vatRate}%`
          }
          value={formatAed(Math.abs(txn.vat))}
        />
        <Row
          strong
          label={
            isCredit
              ? 'Refund AED'
              : txn.type === 'ADVANCE'
                ? 'Advance AED (VAT inclusive)'
                : 'Total AED'
          }
          value={formatAed(txn.total * sign)}
        />
        {txn.payerShare > 0 ? (
          <Row label="Billed to insurer" value={formatAed(txn.payerShare)} />
        ) : null}
      </dl>

      <div className="space-y-0.5 border-t pt-3 text-xs">
        <p className="font-semibold">{isCredit ? 'Refunded to' : 'Receipt'}</p>
        {txn.receiptNumber ? (
          <p>
            Receipt no. <span className="font-mono">{txn.receiptNumber}</span>
          </p>
        ) : null}
        {txn.tenders.length === 0 ? (
          <p className="text-muted-foreground">No patient payment — billed to insurer.</p>
        ) : (
          txn.tenders.map((tender, index) => (
            <p key={`${tender.method}-${index}`} className="tabular-nums">
              {TENDER_META[tender.method].label}
              {tender === cashTender && tender.tendered !== null
                ? ` · received ${formatAed(tender.tendered)}, change ${formatAed(tender.change)}`
                : describeTender(tender)
                  ? ` · ${describeTender(tender)}`
                  : ''}
              : <span className="font-semibold">AED {formatAed(tender.amount)}</span>
            </p>
          ))
        )}
        {txn.discountReason ? (
          <p className="text-muted-foreground">
            Discount: {txn.discountReason}
            {txn.discountApprovedBy ? ` · approved by ${txn.discountApprovedBy}` : ''}
          </p>
        ) : null}
        {txn.payerAuthNumber ? (
          <p className="text-muted-foreground">
            Insurer approval no. <span className="font-mono">{txn.payerAuthNumber}</span>
          </p>
        ) : null}
        {txn.outstanding > 0 ? (
          <p className="text-warning font-semibold">
            Outstanding on account: AED {formatAed(txn.outstanding)}
          </p>
        ) : null}
        <p className="text-muted-foreground">
          Advance balance remaining ({tenantName}): AED {formatAed(advanceBalance)}
        </p>
      </div>

      <div className="border-t pt-3 text-center text-xs">
        <p className="font-medium">Thank you for choosing {tenantName}.</p>
        <p className="text-muted-foreground mt-1">
          This is a computer-generated document and does not require a signature.
        </p>
      </div>
    </div>
  );
}

export function DocumentDialog({ txn, onClose }: { txn: LedgerTxn | null; onClose: () => void }) {
  const { state, patientByMrn } = useCounter();
  const currentUserQuery = useCurrentUserQuery();
  const previewRef = useRef<HTMLDivElement>(null);
  const patient = txn ? patientByMrn(txn.patientMrn) : undefined;
  const tenantName = currentUserQuery.data?.tenant.name ?? 'Medical EMR';

  return (
    <Dialog open={txn !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        {txn ? (
          <>
            <DialogHeader>
              <DialogTitle>{TITLES[txn.type].dialog}</DialogTitle>
              <DialogDescription>
                Posted {txn.number}. Share the copy with the Patient before closing.
              </DialogDescription>
            </DialogHeader>

            <div ref={previewRef}>
              <DocumentBody
                txn={txn}
                tenantName={tenantName}
                advanceBalance={state.advanceBalances[txn.patientMrn] ?? 0}
              />
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.success(`Sent to ${patient?.phone ?? 'the Patient'} by WhatsApp (demo).`)
                  }
                >
                  <MessageCircle className="size-4" />
                  Send by WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success(`PDF of ${txn.number} emailed (demo).`)}
                >
                  <Mail className="size-4" />
                  Email PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => previewRef.current && printPreview(previewRef.current)}
                >
                  <Printer className="size-4" />
                  Print
                </Button>
              </div>
              <Button type="button" onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
