import type { VisitSummary } from '@/app/api/lib/modules/visit/schemas/visit-summary-schema';
import {
  getInvoiceStatusLabel,
  getPaymentMethodLabel,
} from '@/app/(protected)/billing/_utils/invoice-display';

import { calendarParts, dateTimeIn, money, sentenceCase } from '../_utils/visit-summary-format';
import { latestTreatmentNote, treatmentResponse } from '../_utils/visit-summary-notes';
import {
  type PillTone,
  StatusPill,
  SummarySection,
  SummaryTable,
  SummaryTh,
} from './summary-section';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold whitespace-pre-line">{value}</dd>
    </>
  );
}

function TreatmentGiven({
  given,
  notes,
}: {
  given: NonNullable<VisitSummary['treatmentGiven']>;
  notes: VisitSummary['notes'];
}) {
  const note = latestTreatmentNote(notes);
  const response = note ? treatmentResponse(note) : null;
  const timing = [
    response?.actualMinutes ? `Actual ${response.actualMinutes} min` : null,
    given.plannedMinutes ? `planned ${given.plannedMinutes} min` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="border-border mt-2.5 rounded-xl border px-4 py-2.5">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[14px]">
          <span className="font-bold">{given.treatmentName}</span>
          <span className="text-procedure">
            {' '}
            · Session {given.sessionNumber} of {given.totalSessions}
          </span>
        </p>
        {timing ? <p className="text-muted-foreground flex-none text-[12px]">{timing}</p> : null}
      </div>
      {response ? (
        <dl className="mt-2 grid grid-cols-[7.5rem_1fr_7.5rem_1fr] gap-x-4 gap-y-1.5 text-[12.5px] leading-snug">
          <Field label="Response" value={response.response || '—'} />
          <Field label="Variations" value={response.variations ?? 'None'} />
          <Field
            label="Pain score"
            value={response.painScore === null ? '—' : `${response.painScore}/10`}
          />
          <Field label="Adverse events" value={response.adverseEvents ?? 'None'} />
        </dl>
      ) : (
        <p className="text-muted-foreground mt-1.5 text-[12px]">
          No signed treatment response for this Session.
        </p>
      )}
    </div>
  );
}

export function SummaryTreatment({ summary }: { summary: VisitSummary }) {
  const { treatmentGiven, treatmentPlans, notes } = summary;

  return (
    <SummarySection
      title="Treatment"
      aside={treatmentGiven ? 'Given in this Visit and plans assigned' : 'Plans assigned'}
    >
      {treatmentGiven ? <TreatmentGiven given={treatmentGiven} notes={notes} /> : null}
      {treatmentPlans.length > 0 ? (
        <SummaryTable
          className="mt-3"
          head={
            <>
              <SummaryTh>Treatment Plan</SummaryTh>
              <SummaryTh className="w-[9rem]">Type</SummaryTh>
              <SummaryTh className="w-[17rem]">Progress</SummaryTh>
            </>
          }
        >
          {treatmentPlans.map((plan) => {
            const percent =
              plan.totalSessions > 0
                ? Math.round((plan.completedSessions / plan.totalSessions) * 100)
                : 0;

            return (
              <tr key={plan.id}>
                <td className="font-semibold">{plan.treatmentName}</td>
                <td>{sentenceCase(plan.sessionStructure)}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <div
                      className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={plan.totalSessions}
                      aria-valuenow={plan.completedSessions}
                      aria-label={`${plan.treatmentName} progress`}
                    >
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="flex-none tabular-nums">
                      {plan.completedSessions} of {plan.totalSessions} done
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </SummaryTable>
      ) : null}
    </SummarySection>
  );
}

function NextAppointment({ appointment }: { appointment: VisitSummary['nextAppointment'] }) {
  if (!appointment) {
    return (
      <p className="bg-accent text-muted-foreground mt-3 rounded-xl px-4 py-3 text-[12.5px]">
        No upcoming Appointment.
      </p>
    );
  }

  const date = calendarParts(appointment.slotDate);
  const purpose = appointment.treatmentName
    ? [
        appointment.treatmentName,
        appointment.sessionNumber
          ? `Session ${appointment.sessionNumber}${appointment.totalSessions ? ` of ${appointment.totalSessions}` : ''}`
          : null,
      ]
        .filter(Boolean)
        .join(', ')
    : appointment.doctorName;

  return (
    <div className="bg-accent mt-3 flex gap-3.5 rounded-xl p-3.5">
      <div className="bg-card border-border flex h-[3.75rem] w-[3.5rem] flex-none flex-col items-center justify-center rounded-lg border">
        <span className="text-primary text-[11px] font-semibold">{date.month}</span>
        <span className="text-[22px] leading-none font-bold">{date.day}</span>
      </div>
      <div className="min-w-0 text-[12.5px] leading-snug">
        <p className="text-[13.5px] font-bold">
          {date.weekday}
          {appointment.startTime ? `, ${appointment.startTime}` : ''}
        </p>
        {purpose ? <p className="mt-0.5">{purpose}</p> : null}
        <p className="text-muted-foreground mt-0.5 font-mono text-[11.5px]">
          {appointment.bookingNumber} · {appointment.statusName}
        </p>
      </div>
    </div>
  );
}

export function SummaryMedicationsAndFollowUp({
  summary,
  printedOn,
}: {
  summary: VisitSummary;
  printedOn: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_14.5rem] gap-6">
      <SummarySection title="Current medications" aside={`As on ${printedOn}`}>
        {summary.medications.length > 0 ? (
          <SummaryTable
            head={
              <>
                <SummaryTh>Medicine</SummaryTh>
                <SummaryTh>Dose</SummaryTh>
                <SummaryTh>Route</SummaryTh>
                <SummaryTh>Frequency</SummaryTh>
              </>
            }
          >
            {summary.medications.map((medication) => (
              <tr key={medication.id}>
                <td className="font-semibold">{medication.drugName}</td>
                <td className="whitespace-nowrap">{medication.dose ?? '—'}</td>
                <td className="whitespace-nowrap">{medication.route ?? '—'}</td>
                <td>{medication.frequency ?? '—'}</td>
              </tr>
            ))}
          </SummaryTable>
        ) : (
          <p className="text-muted-foreground mt-3 text-[12.5px]">No active medications.</p>
        )}
      </SummarySection>
      <SummarySection title="Next appointment">
        <NextAppointment appointment={summary.nextAppointment} />
      </SummarySection>
    </div>
  );
}

const INVOICE_TONE: Record<NonNullable<VisitSummary['billing']>['status'], PillTone> = {
  DRAFT: 'muted',
  FINALIZED: 'primary',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  VOID: 'destructive',
};

function Total({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <>
      <dt className={strong ? 'text-foreground font-bold' : 'text-muted-foreground'}>{label}</dt>
      <dd className={strong ? 'font-bold' : undefined}>{value}</dd>
    </>
  );
}

export function SummaryBilling({
  billing,
  timeZone,
}: {
  billing: NonNullable<VisitSummary['billing']>;
  timeZone: string;
}) {
  return (
    <SummarySection
      title="Billing"
      aside={
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[12px]">{billing.invoiceNumber}</span> ·
          <StatusPill tone={INVOICE_TONE[billing.status]}>
            {getInvoiceStatusLabel(billing.status)}
          </StatusPill>
        </span>
      }
    >
      <SummaryTable
        head={
          <>
            <SummaryTh>Item</SummaryTh>
            <SummaryTh className="w-[4rem] text-right">Qty</SummaryTh>
            <SummaryTh className="w-[7.5rem] text-right">Unit price</SummaryTh>
            <SummaryTh className="w-[8rem] text-right">Amount (AED)</SummaryTh>
          </>
        }
      >
        {billing.lines.map((line) => (
          <tr key={line.id}>
            <td>{line.description}</td>
            <td className="text-right tabular-nums">{line.quantity}</td>
            <td className="text-right tabular-nums">{money(line.unitPrice)}</td>
            <td className="text-right tabular-nums">{money(line.amount)}</td>
          </tr>
        ))}
      </SummaryTable>
      <div className="mt-2.5 flex items-start justify-between gap-6 text-[12.5px] leading-snug">
        <div>
          {billing.payments.length > 0 ? (
            <>
              <p className="text-muted-foreground text-[11.5px] font-semibold tracking-[0.1em] uppercase">
                Payments
              </p>
              <ul className="mt-1 space-y-0.5">
                {billing.payments.map((payment) => (
                  <li key={payment.id}>
                    <span className="font-mono">{payment.receiptNumber}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      · {getPaymentMethodLabel(payment.method)} ·{' '}
                      {dateTimeIn(payment.receivedAt, timeZone)} ·
                    </span>{' '}
                    <span className="font-semibold tabular-nums">{money(payment.amount)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
        <dl className="grid flex-none grid-cols-[auto_5.5rem] gap-x-6 gap-y-0.5 text-right tabular-nums">
          <Total label="Subtotal" value={money(billing.subtotal)} />
          <Total label="Discount" value={`− ${money(billing.discountAmount)}`} />
          <div className="border-foreground col-span-2 border-t" />
          <Total label="Total" value={money(billing.grandTotal)} strong />
          <Total label="Paid" value={money(billing.amountPaid)} />
          <Total label="Balance Due" value={money(billing.balanceDue)} strong />
        </dl>
      </div>
    </SummarySection>
  );
}
