import { useState } from 'react';
import { Info } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { ADVANCE_PURPOSES } from '../_data/counter-seed';
import { ADVANCE_VAT_RATE, buildAdvanceTxn } from '../_utils/counter-ledger';
import { formatAed, splitVatInclusive } from '../_utils/money';
import { validateTenders } from '../_utils/tender';
import type { LedgerTxn, TenderInput } from '../_utils/counter-types';
import { CounterField } from './counter-field';
import { useCounter } from './counter-state';
import { PatientPicker, PatientStrip } from './patient-picker';
import { TenderPanel } from './tender-panel';

export function AdvanceTab({ onPosted }: { onPosted: (txn: LedgerTxn) => void }) {
  const { state, shiftOpen, dispatch, patientByMrn } = useCounter();
  const [mrn, setMrn] = useState('');
  const [purpose, setPurpose] = useState<string>(ADVANCE_PURPOSES[0]);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [tenders, setTenders] = useState<TenderInput[]>([]);

  const patient = patientByMrn(mrn);
  const balance = patient ? (state.advanceBalances[patient.mrn] ?? 0) : 0;
  const { vat } = splitVatInclusive(amount, ADVANCE_VAT_RATE);

  const validation = validateTenders({
    tenders,
    due: amount,
    advanceBalance: 0,
    allowOutstanding: false,
  });
  const extraErrors = [
    ...(shiftOpen ? [] : ['The shift is closed. Open a new shift to post.']),
    ...(patient ? [] : ['Select a Patient.']),
    ...(amount > 0 ? [] : ['Enter the advance amount.']),
  ];

  function post() {
    if (!patient) {
      return;
    }

    const txn = buildAdvanceTxn({
      state,
      patient,
      amount,
      tenders: validation.resolved,
      purpose: note.trim() ? `${purpose} — ${note.trim()}` : purpose,
    });

    dispatch({ type: 'POST', txn });
    toast.success(`${txn.number} posted.`);
    onPosted(txn);
    setAmount(0);
    setNote('');
    setTenders([]);
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="shadow-fluent-2">
        <CardHeader>
          <CardTitle className="text-base">Collect advance / deposit</CardTitle>
          <CardDescription>
            Credited to the Patient&apos;s advance account. Later Invoices draw it down
            automatically when you choose Advance as a payment method.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <PatientPicker
              id="advance-patient"
              mrn={mrn}
              onChange={(next) => {
                setMrn(next);
                setTenders([]);
              }}
            />
            <CounterField label="Purpose" htmlFor="advance-purpose" required>
              <NativeSelect
                id="advance-purpose"
                className="w-full"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
              >
                {ADVANCE_PURPOSES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </NativeSelect>
            </CounterField>
          </div>

          {patient ? <PatientStrip patient={patient} advanceBalance={balance} /> : null}

          <div className="grid gap-3 md:grid-cols-2">
            <CounterField label="Amount (AED)" htmlFor="advance-amount" required>
              <Input
                id="advance-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                aria-required="true"
                className="text-right tabular-nums"
                value={amount || ''}
                placeholder="0.00"
                onChange={(event) => {
                  setAmount(Number(event.target.value) || 0);
                  setTenders([]);
                }}
              />
            </CounterField>
            <CounterField label="Note on receipt" htmlFor="advance-note">
              <Input
                id="advance-note"
                placeholder="Optional"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </CounterField>
          </div>

          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              Advances for taxable services are treated as VAT-inclusive, and the receipt shows the
              VAT portion, because receiving an advance creates the tax point. The later Invoice
              nets this off. Confirm the treatment with your tax agent.
              {amount > 0 ? (
                <span className="text-foreground mt-1 block font-medium tabular-nums">
                  This receipt includes AED {formatAed(vat)} VAT at {ADVANCE_VAT_RATE}%.
                </span>
              ) : null}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <TenderPanel
        title="Payment"
        subtitle="Cash, card, UPI, Google Pay, bank transfer or cheque."
        dueLabel="Advance to collect"
        due={amount}
        tenders={tenders}
        validation={validation}
        extraErrors={extraErrors}
        advanceBalance={0}
        allowAdvance={false}
        submitLabel="Post advance receipt"
        onTendersChange={setTenders}
        onSubmit={post}
      />
    </div>
  );
}
