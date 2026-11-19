import type { ReactNode } from 'react';

import type { VisitSummary } from '@/app/api/lib/modules/visit/schemas/visit-summary-schema';

import {
  ageAndGender,
  displayPhone,
  minutesBetween,
  patientFullName,
  patientInitials,
  timeIn,
} from '../_utils/visit-summary-format';

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="bg-card border-border rounded-full border px-2.5 py-0.5 text-[12px]">
      {children}
    </span>
  );
}

function Cell({ label, value, note }: { label: string; value: ReactNode; note?: string | null }) {
  return (
    <div className="min-w-0 px-3.5 py-3">
      <dt className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-[13px] leading-snug font-semibold">{value}</dd>
      {note ? <dd className="text-muted-foreground mt-0.5 text-[11px]">{note}</dd> : null}
    </div>
  );
}

/** Patient identity, the Doctor, and the Visit's timeline. */
export function SummaryPatientCard({ summary }: { summary: VisitSummary }) {
  const { patient, visit, timeZone } = summary;
  const details = ageAndGender(patient.dateOfBirth, patient.gender, visit.visitDate);
  const waited = minutesBetween(visit.checkedInAt, visit.consultationStartedAt);
  const consulted = minutesBetween(visit.consultationStartedAt, visit.completedAt);
  const mono = (value: string) => <span className="font-mono">{value}</span>;

  return (
    <section className="border-border overflow-hidden rounded-xl border">
      <div className="bg-muted/60 flex items-center gap-4 px-5 py-4">
        <span
          aria-hidden="true"
          className="border-primary text-primary grid size-12 flex-none place-items-center rounded-full border-2 text-[15px] font-bold"
        >
          {patientInitials(patient)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2.5">
            <span className="font-heading text-[19px] leading-tight font-bold">
              {patientFullName(patient)}
            </span>
            <span className="text-primary font-mono text-[13px] font-medium">{patient.mrn}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {details ? <Chip>{details}</Chip> : null}
            {patient.bloodGroup ? (
              <Chip>
                Blood group <span className="font-semibold">{patient.bloodGroup}</span>
              </Chip>
            ) : null}
            <Chip>{displayPhone(patient.phone)}</Chip>
          </div>
        </div>
        {visit.doctorName ? (
          <div className="border-border flex-none self-stretch border-l pl-5 text-right">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
              Doctor
            </p>
            <p className="mt-1 text-[14px] font-semibold">{visit.doctorName}</p>
          </div>
        ) : null}
      </div>
      <dl className="divide-border border-border grid grid-cols-6 divide-x border-t">
        <Cell label="Date" value={mono(visit.visitDate)} />
        <Cell label="Visit type" value={visit.visitType.name} />
        <Cell label="Booking" value={visit.bookingNumber ? mono(visit.bookingNumber) : 'Walk-in'} />
        <Cell label="Checked in" value={mono(timeIn(visit.checkedInAt, timeZone))} />
        {visit.status === 'CANCELLED' ? (
          <Cell
            label="Cancelled"
            value={visit.cancelledAt ? mono(timeIn(visit.cancelledAt, timeZone)) : '—'}
          />
        ) : (
          <Cell
            label="Started"
            value={
              visit.consultationStartedAt
                ? mono(timeIn(visit.consultationStartedAt, timeZone))
                : '—'
            }
            note={waited === null ? null : `waited ${waited} min`}
          />
        )}
        <Cell
          label="Completed"
          value={visit.completedAt ? mono(timeIn(visit.completedAt, timeZone)) : '—'}
          note={consulted === null ? null : `consult ${consulted} min`}
        />
      </dl>
    </section>
  );
}

/** Why parts of the summary are missing or provisional, for a Visit that is not Completed. */
export function SummaryStateBanner({ summary }: { summary: VisitSummary }) {
  const { visit } = summary;

  if (visit.status === 'CANCELLED') {
    return (
      <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-[12.5px]">
        <span className="font-semibold">This Visit was cancelled</span>
        {visit.cancelledAt ? ` at ${timeIn(visit.cancelledAt, summary.timeZone)}` : ''}.
        {visit.cancellationReason ? ` Reason: ${visit.cancellationReason}` : ''}
      </p>
    );
  }

  if (visit.status !== 'COMPLETED') {
    return (
      <p className="border-warning/30 bg-warning/10 text-warning rounded-xl border px-4 py-3 text-[12.5px]">
        <span className="font-semibold">Provisional.</span> This Visit is still in progress. Only
        signed notes are shown, and details may change before it is completed.
      </p>
    );
  }

  return null;
}
