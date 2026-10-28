import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';
import { APPROVERS } from '../_data/counter-seed';
import {
  DEFAULT_OPENING_FLOAT,
  SUPERVISOR_VARIANCE_LIMIT,
  computeCashDrawer,
  computeDayTotals,
  reconcileShift,
  validateClose,
} from '../_utils/counter-ledger';
import { formatAed, round2 } from '../_utils/money';
import { CounterField } from './counter-field';
import { useCounter } from './counter-state';
import { ShiftOpenPanel } from './shift-open-panel';
import { Money, TenderChips, TxnTypeBadge } from './txn-cells';

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={cn('bg-card shadow-fluent-2 rounded-lg border border-t-2 p-3', accent)}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-heading text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ReconRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={cn('flex justify-between text-sm', strong && 'font-medium')}>
      <dt className={strong ? undefined : 'text-muted-foreground'}>{label}</dt>
      <dd className="tabular-nums">{formatAed(value)}</dd>
    </div>
  );
}

function ClosedShiftSummary() {
  const { state } = useCounter();
  const closing = state.shift.closing;

  if (!closing) {
    return null;
  }

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="text-success size-4" />
          Shift {state.shift.no} closed at {closing.closedAt}
        </CardTitle>
        <CardDescription>
          Posted to the ledger by {closing.closedBy}. Hand the drawer to the next cashier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="max-w-md space-y-1.5">
          <ReconRow label="Expected cash" value={closing.expectedCash} />
          <ReconRow label="Cash counted" value={closing.cashCounted} />
          <ReconRow label="Cash variance" value={closing.cashVariance} />
          <ReconRow label="Card difference" value={closing.cardDifference} />
          <ReconRow label="Retained as next float" value={closing.retainedFloat} strong />
          <ReconRow label="Deposit to safe" value={closing.depositToSafe} strong />
        </dl>
        {closing.varianceReason ? (
          <p className="text-muted-foreground mt-3 text-sm">
            Variance reason: {closing.varianceReason}
            {closing.varianceApprovedBy ? ` · approved by ${closing.varianceApprovedBy}` : ''}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function DayCloseTab() {
  const { state, shiftOpen, dispatch } = useCounter();
  const [cashCounted, setCashCounted] = useState('');
  const [cardBatch, setCardBatch] = useState('');
  const [reason, setReason] = useState('');
  const [approvedBy, setApprovedBy] = useState('');

  const txns = state.ledger.filter((txn) => txn.shiftNo === state.shift.no);
  const totals = computeDayTotals(txns);
  const drawer = computeCashDrawer(state.shift, txns);
  const outstandingTxns = txns.filter((txn) => txn.outstanding > 0);

  const counted = cashCounted === '' ? null : Number(cashCounted);
  const batch = cardBatch === '' ? null : Number(cardBatch);
  const { cashVariance, cardDifference } = reconcileShift({
    expectedCash: drawer.expectedCash,
    expectedCard: drawer.expectedCard,
    cashCounted: counted,
    cardBatchTotal: batch,
  });
  const errors = validateClose({ cashVariance, cardDifference, reason, approvedBy });
  const hasDifference = (cashVariance ?? 0) !== 0 || (cardDifference ?? 0) !== 0;
  const needsApproval =
    Math.max(Math.abs(cashVariance ?? 0), Math.abs(cardDifference ?? 0)) >
    SUPERVISOR_VARIANCE_LIMIT;

  function closeShift() {
    if (counted === null || batch === null || cashVariance === null || cardDifference === null) {
      return;
    }

    const retained = Math.min(DEFAULT_OPENING_FLOAT, counted);

    dispatch({
      type: 'CLOSE_SHIFT',
      closing: {
        cardDifference,
        cashVariance,
        cashCounted: counted,
        cardBatchTotal: batch,
        retainedFloat: retained,
        closedAt: format(new Date(), 'HH:mm'),
        closedBy: state.shift.cashier,
        expectedCash: drawer.expectedCash,
        depositToSafe: round2(counted - retained),
        varianceReason: hasDifference ? reason.trim() : null,
        varianceApprovedBy: needsApproval ? approvedBy : null,
      },
    });
    toast.success(`Shift ${state.shift.no} closed and posted to the ledger.`);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Cash collected"
          value={`AED ${formatAed(totals.cashCollected)}`}
          accent="border-t-success"
        />
        <Kpi
          label="Card collected"
          value={`AED ${formatAed(totals.cardCollected)}`}
          accent="border-t-primary"
        />
        <Kpi
          label="Advance applied"
          value={`AED ${formatAed(totals.advanceApplied)}`}
          accent="border-t-procedure"
        />
        <Kpi
          label="Advances received"
          value={`AED ${formatAed(totals.advancesReceived)}`}
          accent="border-t-success"
        />
        <Kpi
          label="Billed to payers"
          value={`AED ${formatAed(totals.billedToPayers)}`}
          accent="border-t-primary"
        />
        <Kpi
          label="Outstanding"
          value={`AED ${formatAed(totals.outstanding)}`}
          accent="border-t-destructive"
        />
        <Kpi
          label="Refunds"
          value={`AED ${formatAed(totals.refunds)}`}
          accent="border-t-destructive"
        />
        <Kpi
          label="Bank, cheque & Google Pay"
          value={`AED ${formatAed(totals.bankAndDigital)}`}
          accent="border-t-primary"
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Card className="shadow-fluent-2">
            <CardHeader>
              <CardTitle className="text-base">
                Transactions · {totals.invoices} Invoices · {txns.length} entries
              </CardTitle>
              <CardDescription>
                Shift {state.shift.no} at {state.shift.counter}, opened {state.shift.openedAt}.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="text-muted-foreground border-y text-left text-xs">
                    <th className="p-2 pl-4 font-medium">Time</th>
                    <th className="p-2 font-medium">No.</th>
                    <th className="p-2 font-medium">Type</th>
                    <th className="p-2 font-medium">Patient</th>
                    <th className="p-2 font-medium">Tenders</th>
                    <th className="p-2 text-right font-medium">Patient paid</th>
                    <th className="p-2 text-right font-medium">Payer share</th>
                    <th className="p-2 pr-4 text-right font-medium">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-muted-foreground p-6 text-center">
                        No transactions in this shift yet.
                      </td>
                    </tr>
                  ) : (
                    txns.map((txn) => (
                      <tr key={txn.id} className="hover:bg-muted/50 border-b last:border-b-0">
                        <td className="p-2 pl-4 tabular-nums">{txn.time}</td>
                        <td className="p-2 font-mono text-xs">{txn.number}</td>
                        <td className="p-2">
                          <TxnTypeBadge type={txn.type} />
                        </td>
                        <td className="p-2">{txn.patientName}</td>
                        <td className="p-2">
                          <TenderChips txn={txn} />
                        </td>
                        <td className="p-2 text-right">
                          <Money value={txn.patientPaid} />
                        </td>
                        <td className="p-2 text-right">
                          {txn.payerShare > 0 ? <Money value={txn.payerShare} /> : ''}
                        </td>
                        <td className="p-2 pr-4 text-right">
                          {txn.outstanding > 0 ? (
                            <Money value={txn.outstanding} className="text-warning font-medium" />
                          ) : (
                            ''
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {outstandingTxns.length > 0 ? (
            <Card className="shadow-fluent-2">
              <CardHeader>
                <CardTitle className="text-base">Outstanding Invoices carried forward</CardTitle>
                <CardDescription>
                  These stay on the Patient&apos;s account and are not part of the cash count.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {outstandingTxns.map((txn) => (
                    <li key={txn.id} className="flex justify-between gap-3 py-2">
                      <span>
                        <span className="font-mono text-xs">{txn.number}</span> · {txn.patientName}
                      </span>
                      <Money value={txn.outstanding} className="text-warning font-medium" />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {state.closedShifts.length > 0 ? (
            <Card className="shadow-fluent-2">
              <CardHeader>
                <CardTitle className="text-base">Earlier shifts today</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {state.closedShifts.map(({ shift, txnCount }) => (
                    <li key={shift.no} className="flex flex-wrap justify-between gap-2 py-2">
                      <span>
                        Shift {shift.no} · {shift.cashier} · {txnCount} entries
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        Counted AED {formatAed(shift.closing?.cashCounted ?? 0)} · variance{' '}
                        {formatAed(shift.closing?.cashVariance ?? 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {shiftOpen ? (
          <Card className="shadow-fluent-4">
            <CardHeader>
              <CardTitle className="text-base">
                Cash reconciliation · {state.shift.counter}
              </CardTitle>
              <CardDescription>
                {state.shift.openingBasis === 'AUTHORIZED'
                  ? `Float authorized by ${state.shift.authorizedBy}.`
                  : 'Default opening float.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-1.5">
                <ReconRow label="Opening float" value={drawer.opening} />
                <ReconRow label="+ Cash received" value={drawer.cashReceived} />
                <ReconRow label="− Cash refunds" value={drawer.cashRefunds} />
                <ReconRow label="Expected cash in drawer" value={drawer.expectedCash} strong />
                <ReconRow label="Expected card settlement" value={drawer.expectedCard} />
              </dl>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <CounterField label="Cash counted (AED)" htmlFor="cash-counted" required>
                  <Input
                    id="cash-counted"
                    type="number"
                    step="0.01"
                    min={0}
                    aria-required="true"
                    className="text-right tabular-nums"
                    value={cashCounted}
                    onChange={(event) => setCashCounted(event.target.value)}
                  />
                </CounterField>
                <CounterField label="Variance" htmlFor="cash-variance">
                  <Input
                    id="cash-variance"
                    readOnly
                    tabIndex={-1}
                    className={cn(
                      'bg-muted text-right tabular-nums',
                      (cashVariance ?? 0) !== 0 && 'text-destructive'
                    )}
                    value={cashVariance === null ? '' : formatAed(cashVariance)}
                  />
                </CounterField>
                <CounterField label="Card terminal batch total" htmlFor="card-batch" required>
                  <Input
                    id="card-batch"
                    type="number"
                    step="0.01"
                    min={0}
                    aria-required="true"
                    className="text-right tabular-nums"
                    value={cardBatch}
                    onChange={(event) => setCardBatch(event.target.value)}
                  />
                </CounterField>
                <CounterField label="Card difference" htmlFor="card-difference">
                  <Input
                    id="card-difference"
                    readOnly
                    tabIndex={-1}
                    className={cn(
                      'bg-muted text-right tabular-nums',
                      (cardDifference ?? 0) !== 0 && 'text-destructive'
                    )}
                    value={cardDifference === null ? '' : formatAed(cardDifference)}
                  />
                </CounterField>
              </div>

              {hasDifference ? (
                <div className="space-y-3">
                  <CounterField label="Reason for variance" htmlFor="variance-reason" required>
                    <Textarea
                      id="variance-reason"
                      aria-required="true"
                      rows={2}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </CounterField>
                  {needsApproval ? (
                    <CounterField label="Supervisor approval" htmlFor="variance-approver" required>
                      <NativeSelect
                        id="variance-approver"
                        className="w-full"
                        aria-required="true"
                        value={approvedBy}
                        onChange={(event) => setApprovedBy(event.target.value)}
                      >
                        <option value="">Select…</option>
                        {APPROVERS.map((approver) => (
                          <option key={approver} value={approver}>
                            {approver}
                          </option>
                        ))}
                      </NativeSelect>
                    </CounterField>
                  ) : null}
                </div>
              ) : null}

              {errors.length > 0 ? (
                <ul className="text-warning space-y-1 text-xs">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}

              <Button
                type="button"
                className="w-full"
                disabled={errors.length > 0}
                onClick={closeShift}
              >
                Close shift &amp; post to ledger
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <ClosedShiftSummary />
            <ShiftOpenPanel />
          </div>
        )}
      </div>
    </div>
  );
}
