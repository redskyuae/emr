import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';
import { APPROVERS, REFUND_REASONS } from '../_data/counter-seed';
import {
  buildCreditNoteTxn,
  computeCashDrawer,
  refundableOf,
  validateRefund,
  type RefundSource,
} from '../_utils/counter-ledger';
import { formatAed } from '../_utils/money';
import type { LedgerTxn, TenderMethod } from '../_utils/counter-types';
import { TENDER_META, refundReferenceLabel } from '../_utils/tender';
import { TXN_TYPE_LABEL } from '../_utils/txn-presentation';
import { CounterField } from './counter-field';
import { useCounter } from './counter-state';
import { PatientPicker, PatientStrip } from './patient-picker';

const ADVANCE_SOURCE = 'ADVANCE';

export function RefundTab({ onPosted }: { onPosted: (txn: LedgerTxn) => void }) {
  const { state, shiftOpen, dispatch, patientByMrn } = useCounter();
  const [mrn, setMrn] = useState('');
  const [sourceKey, setSourceKey] = useState(ADVANCE_SOURCE);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<TenderMethod>('CASH');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [approvedBy, setApprovedBy] = useState('');

  const patient = patientByMrn(mrn);
  const balance = patient ? (state.advanceBalances[patient.mrn] ?? 0) : 0;
  const history = state.ledger.filter((txn) => txn.patientMrn === mrn);
  const invoices = history.filter((txn) => txn.type === 'INVOICE');
  const invoice = invoices.find((txn) => txn.number === sourceKey);
  const source: RefundSource = invoice ? { kind: 'INVOICE', invoice } : { kind: 'ADVANCE' };
  const refundable = patient ? refundableOf(source, balance, state.ledger) : 0;
  // Money can go back to the instrument it came in on: card, UPI or Google Pay.
  const originalInstruments = (['CARD', 'UPI', 'GOOGLE_PAY'] as const).filter((candidate) =>
    invoice?.tenders.some((tender) => tender.method === candidate)
  );
  const cashInDrawer = computeCashDrawer(state.shift, state.ledger).expectedCash;

  const errors = [
    ...(shiftOpen ? [] : ['The shift is closed. Open a new shift to post.']),
    ...(patient ? [] : ['Select a Patient.']),
    ...validateRefund({ amount, refundable, method, reference, reason, approvedBy, cashInDrawer }),
  ];

  function changePatient(next: string) {
    setMrn(next);
    setSourceKey(ADVANCE_SOURCE);
    setAmount(0);
    setMethod('CASH');
  }

  function changeSource(next: string) {
    setSourceKey(next);
    setAmount(0);
    setMethod('CASH');
  }

  function post() {
    if (!patient) {
      return;
    }

    const txn = buildCreditNoteTxn({
      state,
      patient,
      source,
      amount,
      method,
      reason,
      approvedBy,
      reference: reference.trim(),
    });

    dispatch({ type: 'POST', txn });
    toast.success('Credit note posted.');
    onPosted(txn);
    setAmount(0);
    setReason('');
    setApprovedBy('');
    setReference('');
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="shadow-fluent-2">
        <CardHeader>
          <CardTitle className="text-base">Refund</CardTitle>
          <CardDescription>
            Issues a credit note. Cash and bank refunds need a reason and an approver; card refunds
            go back to the original card.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <PatientPicker id="refund-patient" mrn={mrn} onChange={changePatient} />
            <CounterField label="Refund of" htmlFor="refund-source" required>
              <NativeSelect
                id="refund-source"
                className="w-full"
                disabled={!patient}
                value={sourceKey}
                onChange={(event) => changeSource(event.target.value)}
              >
                <option value={ADVANCE_SOURCE}>Unused advance balance</option>
                {invoices.map((item) => (
                  <option key={item.number} value={item.number}>
                    Invoice {item.number}
                  </option>
                ))}
              </NativeSelect>
            </CounterField>
            <CounterField label="Refundable" htmlFor="refund-refundable">
              <Input
                id="refund-refundable"
                readOnly
                tabIndex={-1}
                className="bg-muted text-right tabular-nums"
                value={`AED ${formatAed(refundable)}`}
              />
            </CounterField>
          </div>

          {patient ? <PatientStrip patient={patient} advanceBalance={balance} /> : null}

          <div className="grid gap-3 md:grid-cols-3">
            <CounterField label="Refund amount (AED)" htmlFor="refund-amount" required>
              <Input
                id="refund-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                aria-required="true"
                className="text-right tabular-nums"
                value={amount || ''}
                placeholder="0.00"
                onChange={(event) => setAmount(Number(event.target.value) || 0)}
              />
            </CounterField>
            <CounterField label="Refund to" htmlFor="refund-method" required>
              <NativeSelect
                id="refund-method"
                className="w-full"
                value={method}
                onChange={(event) => setMethod(event.target.value as TenderMethod)}
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                {originalInstruments.map((instrument) => (
                  <option key={instrument} value={instrument}>
                    Original {instrument === 'CARD' ? 'card' : TENDER_META[instrument].label}
                  </option>
                ))}
              </NativeSelect>
            </CounterField>
            {method !== 'CASH' ? (
              <CounterField
                label={refundReferenceLabel(method)}
                htmlFor="refund-reference"
                required
              >
                <Input
                  id="refund-reference"
                  aria-required="true"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
              </CounterField>
            ) : (
              <div aria-hidden="true" />
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <CounterField label="Reason" htmlFor="refund-reason" required>
              <NativeSelect
                id="refund-reason"
                className="w-full"
                aria-required="true"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              >
                <option value="">Select…</option>
                {REFUND_REASONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </NativeSelect>
            </CounterField>
            <CounterField label="Approved by" htmlFor="refund-approver" required>
              <NativeSelect
                id="refund-approver"
                className="w-full"
                aria-required="true"
                value={approvedBy}
                onChange={(event) => setApprovedBy(event.target.value)}
              >
                <option value="">Select…</option>
                {APPROVERS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </NativeSelect>
            </CounterField>
          </div>

          {errors.length > 0 ? (
            <ul
              aria-label="Before you can post"
              className="bg-warning/10 border-warning/30 text-warning space-y-1 rounded-md border p-3 text-xs"
            >
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}

          <Button type="button" disabled={errors.length > 0} onClick={post}>
            Issue credit note &amp; refund
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2 h-fit">
        <CardHeader>
          <CardTitle className="text-base">Payment history for this Patient</CardTitle>
          <CardDescription>Current shift only.</CardDescription>
        </CardHeader>
        <CardContent>
          {!patient ? (
            <p className="text-muted-foreground text-sm">Select a Patient to see their payments.</p>
          ) : history.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payments in this shift.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th className="pb-1.5 font-medium">No.</th>
                  <th className="pb-1.5 font-medium">Type</th>
                  <th className="pb-1.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map((txn) => (
                  <tr key={txn.id} className="border-b last:border-b-0">
                    <td className="py-1.5 font-mono text-xs">{txn.number}</td>
                    <td className="py-1.5">
                      <Badge variant="outline">{TXN_TYPE_LABEL[txn.type]}</Badge>
                    </td>
                    <td
                      className={cn(
                        'py-1.5 text-right tabular-nums',
                        txn.patientPaid < 0 && 'text-destructive'
                      )}
                    >
                      {formatAed(txn.patientPaid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
