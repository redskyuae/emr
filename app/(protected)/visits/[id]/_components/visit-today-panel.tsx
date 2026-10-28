'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalendarPlus, Check, Circle, NotebookPen, ShieldCheck } from 'lucide-react';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { PatientChart } from '@/app/api/lib/modules/patient-chart/schemas/patient-chart-schema';
import { RichTextContent } from '@/components/clinical/rich-text-content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { VisitDetailsCard } from './visit-details-card';

type Props = {
  visit: Visit;
  chart: PatientChart | undefined;
  chartLoading: boolean;
  chartError: boolean;
  invoiceCount: number;
  invoiceLoading: boolean;
  invoiceError: boolean;
  canRecordVitals: boolean;
  canCreateNote: boolean;
  canCreateInvoice: boolean;
  canBookAppointment: boolean;
  onRecordVitals: () => void;
  onDoctorConsultation: () => void;
  onDailyTreatment: () => void;
};

function ChecklistRow({
  label,
  detail,
  done,
  action,
  loading = false,
}: {
  label: string;
  detail: React.ReactNode;
  done: boolean;
  action?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 border-t py-3 first:border-t-0">
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
        <div className="text-muted-foreground text-xs">{detail}</div>
      </div>
      {!loading ? action : null}
    </li>
  );
}

export function VisitTodayPanel({
  visit,
  chart,
  chartLoading,
  chartError,
  invoiceCount,
  invoiceLoading,
  invoiceError,
  canRecordVitals,
  canCreateNote,
  canCreateInvoice,
  canBookAppointment,
  onRecordVitals,
  onDoctorConsultation,
  onDailyTreatment,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const active = visit.status === 'CHECKED_IN' || visit.status === 'IN_CONSULTATION';
  const visitVitals = (chart?.vitalSigns ?? []).filter((item) => item.visitId === visit.id);
  const visitNotes = (chart?.clinicalNotes ?? []).filter((item) => item.visitId === visit.id);
  const signedCount = visitNotes.filter((note) => note.status === 'signed').length;
  const session = visit.treatmentSession;
  const description = session?.procedure ?? '';
  const canExpand = description.length > 190;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="space-y-5">
        <Card className="shadow-fluent-2 gap-4">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {session
                  ? `Session ${session.sessionNumber} · ${session.durationMinutes ?? 'Duration not set'}${session.durationMinutes ? ' min' : ''}`
                  : visit.visitType.name}
              </span>
              <Badge variant={active ? 'secondary' : 'outline'}>
                {visit.status === 'COMPLETED' ? 'Completed' : active ? 'In progress' : 'Cancelled'}
              </Badge>
            </div>
            <CardTitle className="text-lg">
              {session ? 'Daily treatment' : "Today's consultation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {visit.treatment ? <Badge variant="outline">{visit.treatment.name}</Badge> : null}
                  <Badge variant="outline">{session.label}</Badge>
                </div>
                <div>
                  <p
                    className={cn(
                      'text-muted-foreground text-sm',
                      !expanded && canExpand && 'line-clamp-2'
                    )}
                  >
                    {description || 'No procedure details recorded for this Session.'}
                  </p>
                  {canExpand ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                      aria-expanded={expanded}
                      onClick={() => setExpanded((current) => !current)}
                    >
                      {expanded ? 'Show less' : 'Read more'}
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              <RichTextContent
                value={visit.chiefComplaint || 'No purpose of Visit recorded yet.'}
                className="text-muted-foreground"
              />
            )}
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {active && canCreateNote ? (
                <Button type="button" onClick={session ? onDailyTreatment : onDoctorConsultation}>
                  <NotebookPen className="size-4" />
                  {session ? 'Record treatment response' : 'Record consultation'}
                </Button>
              ) : null}
              {canBookAppointment ? (
                <Button asChild variant="outline">
                  <Link href="/appointments/new">
                    <CalendarPlus className="size-4" />
                    {session ? 'Book next Session' : 'Book Appointment'}
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
        <VisitDetailsCard visit={visit} />
      </div>

      <aside className="space-y-5">
        <Card className="shadow-fluent-2 gap-0">
          <CardHeader>
            <CardTitle className="text-base">To complete this Visit</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              <ChecklistRow
                label="Vital Signs"
                loading={chartLoading}
                detail={
                  chartLoading ? (
                    <Skeleton className="mt-1 h-3 w-28" />
                  ) : chartError ? (
                    'Could not load records'
                  ) : visitVitals.length ? (
                    `${visitVitals.length} recorded`
                  ) : (
                    'Not recorded'
                  )
                }
                done={visitVitals.length > 0}
                action={
                  active && canRecordVitals ? (
                    <Button size="sm" variant="outline" onClick={onRecordVitals}>
                      Record
                    </Button>
                  ) : undefined
                }
              />
              <ChecklistRow
                label="Clinical Note"
                loading={chartLoading}
                detail={
                  chartLoading ? (
                    <Skeleton className="mt-1 h-3 w-32" />
                  ) : chartError ? (
                    'Could not load records'
                  ) : (
                    `${visitNotes.length} notes · ${signedCount} signed`
                  )
                }
                done={visitNotes.length > 0}
                action={
                  active && canCreateNote ? (
                    <Button size="sm" variant="outline" onClick={onDoctorConsultation}>
                      Start
                    </Button>
                  ) : undefined
                }
              />
              {session ? (
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
                  invoiceLoading ? (
                    <Skeleton className="mt-1 h-3 w-24" />
                  ) : invoiceError ? (
                    'Could not load Invoices'
                  ) : invoiceCount ? (
                    `${invoiceCount} linked`
                  ) : (
                    'Not created'
                  )
                }
                done={invoiceCount > 0}
                action={
                  canCreateInvoice && !invoiceCount ? (
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
        <Card className="shadow-fluent-2 gap-0">
          <CardContent className="flex gap-3 p-4">
            <ShieldCheck className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Patient safety</p>
              <div className="text-muted-foreground text-sm">
                {chartLoading ? (
                  <Skeleton className="h-4 w-52 max-w-full" />
                ) : chartError ? (
                  'Safety records could not be loaded.'
                ) : (
                  `${chart?.allergies.filter((item) => item.status === 'active').length ?? 0} active allergies · ${chart?.medications.filter((item) => item.status === 'active').length ?? 0} current medications on record.`
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
