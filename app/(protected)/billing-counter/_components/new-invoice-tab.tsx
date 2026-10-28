import { useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { buildInvoiceTxn } from '../_utils/counter-ledger';
import { calculateInvoice, validateInvoiceLines } from '../_utils/invoice-calc';
import { validateTenders } from '../_utils/tender';
import type { InvoiceLine, LedgerTxn, TenderInput } from '../_utils/counter-types';
import { CounterField } from './counter-field';
import { useCounter } from './counter-state';
import { InvoiceLinesEditor } from './invoice-lines-editor';
import { PatientPicker, PatientStrip } from './patient-picker';
import { TenderPanel } from './tender-panel';

const NO_VISIT = 'none';

export function NewInvoiceTab({
  initialMrn,
  initialVisit,
  onPosted,
}: {
  initialMrn: string;
  initialVisit: string;
  onPosted: (txn: LedgerTxn) => void;
}) {
  const { state, shiftOpen, dispatch, patientByMrn } = useCounter();
  const [mrn, setMrn] = useState(initialMrn);
  const [visitNumber, setVisitNumber] = useState(initialVisit);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [tenders, setTenders] = useState<TenderInput[]>([]);
  const [leaveOutstanding, setLeaveOutstanding] = useState(false);

  const patient = patientByMrn(mrn);
  const advanceBalance = patient ? (state.advanceBalances[patient.mrn] ?? 0) : 0;
  const totals = calculateInvoice(lines);
  const hasPayer = Boolean(patient?.payer);

  const validation = validateTenders({
    tenders,
    advanceBalance,
    due: totals.patientShare,
    allowOutstanding: leaveOutstanding,
  });
  const extraErrors = [
    ...(shiftOpen ? [] : ['The shift is closed. Open a new shift to post.']),
    ...(patient ? [] : ['Select a Patient.']),
    ...validateInvoiceLines(lines),
  ];

  function changePatient(next: string) {
    const nextPatient = patientByMrn(next);

    setMrn(next);
    setLines([]);
    setTenders([]);
    setLeaveOutstanding(false);
    setVisitNumber(nextPatient?.visits[0]?.number ?? NO_VISIT);
  }

  function post() {
    if (!patient) {
      return;
    }

    const txn = buildInvoiceTxn({
      state,
      patient,
      lines,
      tenders: validation.resolved.filter((tender) => tender.amount > 0),
      outstanding: validation.remaining,
      visitNumber: visitNumber === NO_VISIT ? null : visitNumber,
    });

    dispatch({ type: 'POST', txn });
    toast.success(`${txn.number} posted.`);
    onPosted(txn);
    setLines([]);
    setTenders([]);
    setLeaveOutstanding(false);
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4">
        <Card className="shadow-fluent-2">
          <CardHeader>
            <CardTitle className="text-base">Patient &amp; Visit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <PatientPicker id="invoice-patient" mrn={mrn} onChange={changePatient} />
              <CounterField
                label="Visit"
                htmlFor="invoice-visit"
                hint="Optional — counter sales have no Visit."
              >
                <NativeSelect
                  id="invoice-visit"
                  className="w-full"
                  disabled={!patient}
                  value={visitNumber}
                  onChange={(event) => setVisitNumber(event.target.value)}
                >
                  <option value={NO_VISIT}>No Visit (counter sale)</option>
                  {patient?.visits.map((visit) => (
                    <option key={visit.number} value={visit.number}>
                      {visit.number} · {visit.label}
                    </option>
                  ))}
                </NativeSelect>
              </CounterField>
            </div>
            {patient ? <PatientStrip patient={patient} advanceBalance={advanceBalance} /> : null}
          </CardContent>
        </Card>

        <Card className="shadow-fluent-2">
          <CardHeader>
            <CardTitle className="text-base">Charges</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceLinesEditor lines={lines} hasPayer={hasPayer} onChange={setLines} />
          </CardContent>
        </Card>
      </div>

      <TenderPanel
        title="Payment"
        subtitle="Split across cash, card, cheque, transfer, Google Pay and advance."
        dueLabel="Patient to pay"
        due={totals.patientShare}
        tenders={tenders}
        validation={validation}
        extraErrors={extraErrors}
        advanceBalance={advanceBalance}
        allowAdvance
        outstanding={{ checked: leaveOutstanding, onChange: setLeaveOutstanding }}
        submitLabel="Post invoice & receipt"
        onTendersChange={setTenders}
        onSubmit={post}
      />
    </div>
  );
}
