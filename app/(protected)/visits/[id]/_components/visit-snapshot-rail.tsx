'use client';

import Link from 'next/link';
import {
  Activity,
  CalendarPlus,
  Check,
  Circle,
  ClipboardPlus,
  FilePlus2,
  NotebookPen,
  Pill,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import type { PatientChart } from '@/app/api/lib/modules/patient-chart/schemas/patient-chart-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { VisitPreviousVisits } from './visit-previous-visits';

function ChecklistRow({
  label,
  detail,
  done,
  action,
  loading = false,
}: {
  label: string;
  detail: string;
  done: boolean;
  action?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 border-t py-2.5 first:border-t-0 first:pt-0">
      {loading ? (
        <Skeleton className="size-6 shrink-0 rounded-full" />
      ) : (
        <span
          className={cn(
            'grid size-6 shrink-0 place-items-center rounded-full border-2',
            done
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground'
          )}
          aria-hidden="true"
        >
          {done ? <Check className="size-3.5" /> : <Circle className="size-2 fill-current" />}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {loading ? (
          <Skeleton className="mt-1 h-3 w-28" />
        ) : (
          <span className="text-muted-foreground block text-xs">{detail}</span>
        )}
      </div>
      {!loading ? action : null}
    </li>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <Icon className="size-4" />
      {label}
    </>
  );

  return href ? (
    <Button asChild size="sm" variant="outline" className="justify-start">
      <Link href={href}>{content}</Link>
    </Button>
  ) : (
    <Button type="button" size="sm" variant="outline" className="justify-start" onClick={onClick}>
      {content}
    </Button>
  );
}

function VitalTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-md p-2">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-mono text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function latestVitalTiles(vitals: PatientChart['vitalSigns']) {
  const latest = [...vitals].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  )[0];

  if (!latest) return null;

  const tiles = [
    {
      label: 'BP (mmHg)',
      value:
        latest.systolic || latest.diastolic
          ? `${latest.systolic ?? '—'}/${latest.diastolic ?? '—'}`
          : null,
    },
    { label: 'Pulse (bpm)', value: latest.pulseBpm },
    { label: 'Temp (°C)', value: latest.temperatureC },
    { label: 'SpO₂ (%)', value: latest.spo2 },
    { label: 'Weight (kg)', value: latest.weightKg },
    { label: 'BMI', value: latest.bmi },
    { label: 'Pain (0–10)', value: latest.painScore },
  ];

  return {
    recordedAt: new Date(latest.recordedAt).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }),
    tiles: tiles.flatMap((tile) =>
      tile.value === null || tile.value === undefined
        ? []
        : [{ label: tile.label, value: String(tile.value) }]
    ),
  };
}

export function VisitSnapshotRail({
  visit,
  chart,
  chartLoading,
  chartError,
  allergenName,
  invoiceCount,
  invoiceLoading,
  invoiceError,
  canRecordVitals,
  canCreateNote,
  canAssignPlan,
  canCreateInvoice,
  canBookAppointment,
  onRecordVitals,
  onAddNote,
  onAddAllergy,
  onAddMedication,
  onAssignPlan,
  onOpenDocuments,
}: {
  visit: Visit;
  chart: PatientChart | undefined;
  chartLoading: boolean;
  chartError: boolean;
  allergenName: (id: number) => string;
  invoiceCount: number;
  invoiceLoading: boolean;
  invoiceError: boolean;
  canRecordVitals: boolean;
  canCreateNote: boolean;
  canAssignPlan: boolean;
  canCreateInvoice: boolean;
  canBookAppointment: boolean;
  onRecordVitals: () => void;
  onAddNote: () => void;
  onAddAllergy: () => void;
  onAddMedication: () => void;
  onAssignPlan: () => void;
  onOpenDocuments: () => void;
}) {
  const active = visit.status === 'CHECKED_IN' || visit.status === 'IN_CONSULTATION';
  const vitals = (chart?.vitalSigns ?? []).filter((item) => item.visitId === visit.id);
  const notes = (chart?.clinicalNotes ?? []).filter((item) => item.visitId === visit.id);
  const signedCount = notes.filter((note) => note.status === 'signed').length;
  const allergies = (chart?.allergies ?? []).filter((item) => item.status === 'active');
  const medications = (chart?.medications ?? []).filter((item) => item.status === 'active');
  const problems = (chart?.problems ?? []).filter((item) => item.clinicalStatus === 'active');
  const invoiceHref = `/billing?invoice=new&patientId=${visit.patient.id}&visitId=${visit.id}`;
  const latestVitals = latestVitalTiles(vitals);

  return (
    <aside className="space-y-4" aria-label="Visit snapshot">
      <Card className="shadow-fluent-2 gap-3">
        <CardHeader>
          <CardTitle className="text-base">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {active && canRecordVitals ? (
            <QuickAction icon={Activity} label="Vital Signs" onClick={onRecordVitals} />
          ) : null}
          {active && canCreateNote ? (
            <QuickAction icon={NotebookPen} label="Add note" onClick={onAddNote} />
          ) : null}
          {active ? (
            <>
              <QuickAction icon={ShieldAlert} label="Allergy" onClick={onAddAllergy} />
              <QuickAction icon={Pill} label="Medication" onClick={onAddMedication} />
            </>
          ) : null}
          {canAssignPlan ? (
            <QuickAction icon={ClipboardPlus} label="Treatment plan" onClick={onAssignPlan} />
          ) : null}
          <QuickAction icon={FilePlus2} label="Documents" onClick={onOpenDocuments} />
          {canCreateInvoice ? (
            <QuickAction icon={ReceiptText} label="Invoice" href={invoiceHref} />
          ) : null}
          {canBookAppointment ? (
            <QuickAction icon={CalendarPlus} label="Follow-up" href="/appointments/new" />
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2 gap-3">
        <CardHeader className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Vital Signs</CardTitle>
          {active && canRecordVitals ? (
            <Button type="button" size="sm" variant="outline" onClick={onRecordVitals}>
              <Activity className="size-4" />
              Record
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <Skeleton className="h-24 w-full" aria-label="Loading Vital Signs" />
          ) : chartError ? (
            <p className="text-destructive text-sm">Vital Signs could not be loaded.</p>
          ) : latestVitals ? (
            <>
              <dl className="grid grid-cols-2 gap-2">
                {latestVitals.tiles.map((tile) => (
                  <VitalTile key={tile.label} {...tile} />
                ))}
              </dl>
              <p className="text-muted-foreground mt-2 text-xs">
                Latest reading at {latestVitals.recordedAt}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Not recorded for this Visit.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2 gap-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="text-primary size-4" aria-hidden="true" />
            Patient safety
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {chartLoading ? (
            <Skeleton className="h-16 w-full" aria-label="Loading Patient safety information" />
          ) : chartError ? (
            <p className="text-destructive">Safety records could not be loaded.</p>
          ) : (
            <>
              <div>
                <p className="font-medium">Allergies ({allergies.length})</p>
                {allergies.length ? (
                  <ul className="text-muted-foreground mt-1 space-y-1">
                    {allergies.map((allergy) => (
                      <li key={allergy.id}>
                        {allergy.substance ??
                          (allergy.allergenId ? allergenName(allergy.allergenId) : 'Allergen')}
                        {allergy.reaction ? ` · ${allergy.reaction}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mt-1">None recorded.</p>
                )}
              </div>
              <div>
                <p className="font-medium">Active Problems ({problems.length})</p>
                {problems.length ? (
                  <ul className="text-muted-foreground mt-1 space-y-1">
                    {problems.map((problem) => (
                      <li key={problem.id}>{problem.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mt-1">None recorded.</p>
                )}
              </div>
              <div>
                <p className="font-medium">Current medications ({medications.length})</p>
                {medications.length ? (
                  <ul className="text-muted-foreground mt-1 space-y-1">
                    {medications.map((medication) => (
                      <li key={medication.id}>
                        {medication.drugName}
                        {medication.dose ? ` · ${medication.dose}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mt-1">None recorded.</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <VisitPreviousVisits visit={visit} notes={chart?.clinicalNotes ?? []} />

      <Card className="shadow-fluent-2 gap-3">
        <CardHeader>
          <CardTitle className="text-base">To complete this Visit</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            <ChecklistRow
              label="Vital Signs"
              loading={chartLoading}
              detail={
                chartError
                  ? 'Could not load records'
                  : vitals.length
                    ? `${vitals.length} recorded`
                    : 'Not recorded'
              }
              done={vitals.length > 0}
            />
            <ChecklistRow
              label="Clinical Note"
              loading={chartLoading}
              detail={
                chartError
                  ? 'Could not load records'
                  : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'} · ${signedCount} signed`
              }
              done={notes.length > 0 && signedCount === notes.length}
            />
            {visit.treatmentSession ? (
              <ChecklistRow
                label="Treatment Session"
                detail={visit.status === 'COMPLETED' ? 'Completed with Visit' : 'In progress'}
                done={visit.status === 'COMPLETED'}
              />
            ) : null}
            <ChecklistRow
              label="Invoice"
              loading={invoiceLoading}
              detail={
                invoiceError
                  ? 'Could not load Invoices'
                  : invoiceCount
                    ? `${invoiceCount} linked`
                    : 'Not created'
              }
              done={invoiceCount > 0}
              action={
                canCreateInvoice && !invoiceCount && !invoiceError ? (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/billing?invoice=new&patientId=${visit.patient.id}&visitId=${visit.id}`}
                    >
                      Create
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          </ul>
        </CardContent>
      </Card>
    </aside>
  );
}
