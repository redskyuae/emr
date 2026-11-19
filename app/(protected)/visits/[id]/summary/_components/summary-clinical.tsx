import type { ReactNode } from 'react';
import { PiWarningLight } from 'react-icons/pi';

import type { VisitSummary } from '@/app/api/lib/modules/visit/schemas/visit-summary-schema';
import { cn } from '@/lib/utils';

import {
  bloodPressureIsHigh,
  dateTimeIn,
  measurement,
  timeIn,
} from '../_utils/visit-summary-format';
import { type ConsultationGroup, consultationGroups } from '../_utils/visit-summary-notes';
import { StatusPill, SummarySection, SummaryTable, SummaryTh } from './summary-section';

const SEVERITY = {
  mild: { label: 'Mild', className: 'text-warning' },
  moderate: { label: 'Moderate', className: 'text-destructive' },
  severe: { label: 'Severe', className: 'text-destructive uppercase' },
} as const;

export function SummaryAllergies({ allergies }: { allergies: VisitSummary['allergies'] }) {
  if (allergies.length === 0) {
    return (
      <p className="border-border bg-muted/60 text-muted-foreground rounded-xl border px-4 py-3 text-[12.5px]">
        <span className="text-foreground font-semibold">Allergies:</span> No known allergies
      </p>
    );
  }

  return (
    <div className="border-destructive/30 bg-destructive/10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3">
      <p className="text-destructive flex items-center gap-2 text-[12px] font-bold tracking-[0.12em] uppercase">
        <PiWarningLight className="size-5" aria-hidden="true" />
        Allergies
      </p>
      {allergies.map((allergy) => (
        <span
          key={allergy.id}
          className="bg-card border-destructive/20 rounded-md border px-2.5 py-1 text-[12.5px]"
        >
          <span className="font-semibold">{allergy.name}</span>
          {allergy.reaction ? ` · ${allergy.reaction}` : ''} ·{' '}
          <span className={cn('font-semibold', SEVERITY[allergy.severity].className)}>
            {SEVERITY[allergy.severity].label}
          </span>
        </span>
      ))}
    </div>
  );
}

function VitalTile({
  label,
  value,
  unit,
  high = false,
}: {
  label: string;
  value: string;
  unit?: string;
  high?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5',
        high ? 'border-warning/40 bg-warning/10' : 'border-border'
      )}
    >
      <p className="text-muted-foreground text-[11.5px]">
        {label}
        {high ? ' · high' : ''}
      </p>
      <p
        className={cn(
          'mt-1 text-[17px] leading-none font-semibold tabular-nums',
          high && 'text-warning'
        )}
      >
        {value}
        {unit ? (
          <span className="text-muted-foreground ml-0.5 text-[11px] font-normal">{unit}</span>
        ) : null}
      </p>
    </div>
  );
}

export function SummaryVitals({
  vitalSign,
  timeZone,
}: {
  vitalSign: NonNullable<VisitSummary['vitalSign']>;
  timeZone: string;
}) {
  const tiles: ReactNode[] = [];
  const add = (key: string, label: string, value: number | null, unit?: string) => {
    if (value !== null) {
      tiles.push(<VitalTile key={key} label={label} value={measurement(value)} unit={unit} />);
    }
  };

  add('height', 'Height', vitalSign.heightCm, 'cm');
  add('weight', 'Weight', vitalSign.weightKg, 'kg');
  add('bmi', 'BMI', vitalSign.bmi);
  if (vitalSign.systolic !== null && vitalSign.diastolic !== null) {
    tiles.push(
      <VitalTile
        key="bp"
        label="Blood pressure"
        value={`${vitalSign.systolic}/${vitalSign.diastolic}`}
        unit="mmHg"
        high={bloodPressureIsHigh(vitalSign.systolic, vitalSign.diastolic)}
      />
    );
  }
  add('pulse', 'Pulse', vitalSign.pulseBpm, 'bpm');
  add('resp', 'Resp. rate', vitalSign.respRate, '/min');
  add('temp', 'Temperature', vitalSign.temperatureC, '°C');
  add('spo2', 'SpO₂', vitalSign.spo2, '%');
  add('pain', 'Pain score', vitalSign.painScore, '/10');

  return (
    <SummarySection
      title="Vital signs"
      aside={`Latest set · recorded ${timeIn(vitalSign.recordedAt, timeZone)}`}
    >
      <div className="mt-3 grid grid-cols-5 gap-2">{tiles}</div>
    </SummarySection>
  );
}

const GROUP_STYLE: Record<ConsultationGroup['key'], { title: string; className: string }> = {
  subjective: { title: 'Subjective', className: 'text-primary' },
  objective: { title: 'Objective', className: 'text-chart-4' },
  assessment: { title: 'Assessment', className: 'text-pop' },
  plan: { title: 'Plan', className: 'text-procedure' },
};

type SummaryNote = VisitSummary['notes'][number];

export function SummaryConsultation({
  note,
  chiefComplaint,
  timeZone,
}: {
  note: SummaryNote | null;
  chiefComplaint: string | null;
  timeZone: string;
}) {
  const groups: ConsultationGroup[] = note
    ? consultationGroups(note)
    : [{ key: 'subjective', rows: [{ label: 'Chief complaint', value: chiefComplaint ?? '' }] }];

  return (
    <SummarySection
      title="Consultation"
      aside={note ? `${note.noteType.name} note · signed` : 'Chief complaint at check-in'}
    >
      <div className="mt-3 space-y-3.5">
        {groups.map((group) => (
          <div key={group.key}>
            <h3
              className={cn(
                'text-[11.5px] font-bold tracking-[0.12em] uppercase',
                GROUP_STYLE[group.key].className
              )}
            >
              {GROUP_STYLE[group.key].title}
            </h3>
            <dl className="mt-1.5 space-y-1.5 text-[13px] leading-snug">
              {group.rows.map((row, index) => (
                <div key={`${row.label}-${index}`} className="grid grid-cols-[10.5rem_1fr] gap-x-4">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="whitespace-pre-line">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      {note ? (
        <div className="border-border mt-4 flex items-center justify-between gap-3 border-t border-dashed pt-3 text-[12px]">
          <p className="text-muted-foreground">
            Signed by{' '}
            <span className="text-foreground font-semibold">{note.authorName ?? 'Unknown'}</span>
          </p>
          {note.signedAt ? (
            <p className="text-muted-foreground font-mono">{dateTimeIn(note.signedAt, timeZone)}</p>
          ) : null}
        </div>
      ) : null}
    </SummarySection>
  );
}

const CODE_SYSTEM_LABEL = { ICD10CM: 'ICD-10-CM', AYURVEDA: 'Ayurveda' } as const;

export function SummaryDiagnoses({ diagnoses }: { diagnoses: VisitSummary['diagnoses'] }) {
  const ordered = [...diagnoses].sort(
    (a, b) =>
      Number(b.diagnosisType === 'PRINCIPAL') - Number(a.diagnosisType === 'PRINCIPAL') ||
      a.sortOrder - b.sortOrder
  );

  return (
    <SummarySection title="Diagnoses" aside="Principal first">
      <SummaryTable
        head={
          <>
            <SummaryTh className="w-[5.5rem]">Code</SummaryTh>
            <SummaryTh>Diagnosis</SummaryTh>
            <SummaryTh className="w-[6.5rem]">System</SummaryTh>
            <SummaryTh className="w-[6.5rem]">Type</SummaryTh>
            <SummaryTh className="w-[9rem]">Notes</SummaryTh>
          </>
        }
      >
        {ordered.map((diagnosis) => {
          const principal = diagnosis.diagnosisType === 'PRINCIPAL';

          return (
            <tr key={diagnosis.id}>
              <td className="font-mono">{diagnosis.code}</td>
              <td>
                <span className={cn(principal && 'font-semibold')}>{diagnosis.title}</span>
                {diagnosis.englishName ? (
                  <span className="text-muted-foreground"> · {diagnosis.englishName}</span>
                ) : null}
              </td>
              <td>{CODE_SYSTEM_LABEL[diagnosis.codeSystem]}</td>
              <td>
                {principal ? (
                  <StatusPill tone="primary" dot={false}>
                    Principal
                  </StatusPill>
                ) : (
                  <span className="text-muted-foreground">Secondary</span>
                )}
              </td>
              <td className="text-muted-foreground">{diagnosis.notes ?? ''}</td>
            </tr>
          );
        })}
      </SummaryTable>
    </SummarySection>
  );
}
