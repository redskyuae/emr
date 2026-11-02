import { useState } from 'react';
import { toast } from 'sonner';

import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { buildInvoiceTxn } from '../_utils/counter-ledger';
import {
  calculateInvoice,
  largestDiscountPercent,
  validateDiscount,
  validateInvoiceLines,
  validatePayerAuth,
} from '../_utils/invoice-calc';
import { autoAdvanceAmount, newTender, validateTenders } from '../_utils/tender';
import type { InvoiceLine, LedgerTxn, TenderInput } from '../_utils/counter-types';
import { CounterField } from './counter-field';
import { useCounter } from './counter-state';
import { DiscountApproval, InsurerAuthorization } from './invoice-approvals';
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
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [discountReason, setDiscountReason] = useState('');
  const [discountApprovedBy, setDiscountApprovedBy] = useState('');
  const [payerAuth, setPayerAuth] = useState('');

  const patient = patientByMrn(mrn);
  const advanceBalance = patient ? (state.advanceBalances[patient.mrn] ?? 0) : 0;
  const totals = calculateInvoice(lines);
  const hasPayer = Boolean(patient?.payer);

  const autoAmount = autoAdvance ? autoAdvanceAmount(advanceBalance, totals.patientShare) : 0;
  const effectiveTenders: TenderInput[] =
    autoAmount > 0
      ? [{ ...newTender('ADVANCE'), key: 'auto-advance', amount: autoAmount }, ...tenders]
      : tenders;

  const validation = validateTenders({
    tenders: effectiveTenders,
    advanceBalance,
    due: totals.patientShare,
    allowOutstanding: leaveOutstanding,
  });
  const extraErrors = [
    ...(shiftOpen ? [] : ['The shift is closed. Open a new shift to post.']),
    ...(patient ? [] : ['Select a Patient.']),
    ...validateInvoiceLines(lines),
    ...validateDiscount({ lines, reason: discountReason, approvedBy: discountApprovedBy }),
    ...validatePayerAuth({ payerShare: totals.payerShare, authNumber: payerAuth }),
  ];
  const largestDiscount = largestDiscountPercent(lines);
  const selectedVisit = patient?.visits.find((visit) => visit.number === visitNumber);
  const visitLabel = selectedVisit
    ? `Visit ${selectedVisit.number} · ${format(new Date(), 'dd-MMM-yyyy')}`
    : undefined;

  function resetApprovals() {
    setDiscountReason('');
    setDiscountApprovedBy('');
    setPayerAuth('');
  }

  function changePatient(next: string) {
    const nextPatient = patientByMrn(next);

    setMrn(next);
    setLines([]);
    setTenders([]);
    setLeaveOutstanding(false);
    setAutoAdvance(true);
    resetApprovals();
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
      discountReason: discountReason.trim() || null,
      discountApprovedBy: discountApprovedBy || null,
      payerAuthNumber: payerAuth.trim() || null,
    });

    dispatch({ type: 'POST', txn });
    toast.success(`${txn.number} posted.`);
    onPosted(txn);
    setLines([]);
    setTenders([]);
    setLeaveOutstanding(false);
    resetApprovals();
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
            {patient ? (
              <PatientStrip
                patient={patient}
                advanceBalance={advanceBalance}
                visitLabel={visitLabel}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-fluent-2">
          <CardHeader>
            <CardTitle className="text-base">Charges</CardTitle>
            <CardDescription>
              {hasPayer
                ? 'Lines marked Insurer are billed to the insurer; the Patient pays the rest.'
                : 'Patient pays all lines.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InvoiceLinesEditor lines={lines} hasPayer={hasPayer} onChange={setLines} />
            {largestDiscount > 0 ? (
              <DiscountApproval
                largestPercent={largestDiscount}
                reason={discountReason}
                approvedBy={discountApprovedBy}
                onReasonChange={setDiscountReason}
                onApprovedByChange={setDiscountApprovedBy}
              />
            ) : null}
            {patient?.payer && totals.payerShare > 0 ? (
              <InsurerAuthorization
                insurer={patient.payer}
                authNumber={payerAuth}
                onAuthNumberChange={setPayerAuth}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      <TenderPanel
        title="Payment"
        subtitle="Split across cash, card, UPI, wallets, transfer, cheque and advance."
        dueLabel="Patient to pay"
        due={totals.patientShare}
        tenders={tenders}
        validation={validation}
        extraErrors={extraErrors}
        advanceBalance={advanceBalance}
        allowAdvance
        outstanding={{ checked: leaveOutstanding, onChange: setLeaveOutstanding }}
        advanceAuto={{ checked: autoAdvance, onChange: setAutoAdvance, amount: autoAmount }}
        submitLabel="Post invoice & receipt"
        onTendersChange={setTenders}
        onSubmit={post}
      />
    </div>
  );
}
