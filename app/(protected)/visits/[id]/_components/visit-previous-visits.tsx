'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useVisitsQuery } from '@/app/queries/visits/useVisits';
import { RichTextContent } from '@/components/clinical/rich-text-content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { visitStatusPresentation } from '../../_utils/visit-status';
import { visitProcedures, type VisitProcedure } from '../_utils/visit-treatment-plan';

const RECENT_VISIT_LIMIT = 6;

function ProcedureDetail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div>
      <dt className="text-muted-foreground text-xs font-semibold">{label}</dt>
      <dd className="[overflow-wrap:anywhere] whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function PreviousProcedureSession({
  session,
  treatmentName,
}: {
  session: VisitProcedure['sessions'][number];
  treatmentName: string;
}) {
  const timing = [
    session.durationMinutes ? `${session.durationMinutes} min` : null,
    session.setupMinutes ? `${session.setupMinutes} setup` : null,
    session.cleaningMinutes ? `${session.cleaningMinutes} cleaning` : null,
  ].filter(Boolean);
  const title = `Session ${session.sessionNumber}`;
  // Imported Sessions often repeat the Treatment name as their label and procedure.
  const shown = new Set([title, treatmentName].map((value) => value.trim().toLowerCase()));
  const isNew = (value: string | null) => {
    if (!value || shown.has(value.trim().toLowerCase())) return null;
    shown.add(value.trim().toLowerCase());
    return value;
  };
  const label = isNew(session.label);
  const procedure = isNew(session.procedure);

  return (
    <li className="space-y-1.5 border-t pt-2 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <p className="font-medium">{title}</p>
        {session.completed === null ? null : (
          <Badge variant={session.completed ? 'secondary' : 'outline'}>
            {session.completed ? 'Completed' : 'Pending'}
          </Badge>
        )}
      </div>
      {label ? <p className="text-muted-foreground [overflow-wrap:anywhere]">{label}</p> : null}
      {timing.length ? <p className="text-muted-foreground text-xs">{timing.join(' + ')}</p> : null}
      <dl className="space-y-1.5">
        <ProcedureDetail label="Treatment details" value={procedure} />
        <ProcedureDetail label="Preparation" value={session.preparation} />
        <ProcedureDetail label="Equipment" value={session.equipment} />
        <ProcedureDetail label="Warning" value={session.warning} />
        <ProcedureDetail label="Conduction notes" value={session.conductionNote} />
      </dl>
    </li>
  );
}

function PreviousProcedure({ procedure }: { procedure: VisitProcedure }) {
  return (
    <section
      aria-label={`Procedure: ${procedure.treatmentName}`}
      className="border-l-procedure space-y-2 rounded-md border border-l-4 p-2"
    >
      <div>
        <p className="text-procedure text-xs font-semibold tracking-wide uppercase">Procedure</p>
        <p className="font-medium [overflow-wrap:anywhere]">{procedure.treatmentName}</p>
        {procedure.progress ? (
          <p className="text-muted-foreground text-xs">{procedure.progress}</p>
        ) : null}
      </div>
      <ul className="space-y-2">
        {procedure.sessions.map((session) => (
          <PreviousProcedureSession
            key={session.key}
            session={session}
            treatmentName={procedure.treatmentName}
          />
        ))}
      </ul>
    </section>
  );
}

export function VisitPreviousVisits({
  visit,
  notes,
  plans,
}: {
  visit: Visit;
  notes: ClinicalNote[];
  plans: PatientTreatmentPlan[];
}) {
  const visitsQuery = useVisitsQuery({
    patientId: visit.patient.id,
    page: 1,
    limit: RECENT_VISIT_LIMIT,
  });
  const previous = (visitsQuery.data?.data ?? [])
    .filter((item) => item.id !== visit.id)
    .sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime());

  return (
    <div className="space-y-2 text-sm">
      {visitsQuery.isLoading ? (
        <Skeleton className="h-16 w-full" aria-label="Loading previous Visits" />
      ) : visitsQuery.isError ? (
        <div className="flex flex-wrap items-center gap-2" role="alert">
          <p className="text-destructive">Previous Visits could not be loaded.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void visitsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : previous.length === 0 ? (
        <p className="text-muted-foreground">No earlier Visits for this Patient.</p>
      ) : (
        previous.map((item) => {
          const visitNotes = notes.filter((note) => note.visitId === item.id);
          const procedures = visitProcedures(item, plans);

          return (
            <Collapsible key={item.id} className="group/visit rounded-md border">
              <CollapsibleTrigger className="hover:bg-accent focus-visible:ring-ring/50 flex w-full items-center gap-2 rounded-md p-2 text-left outline-none focus-visible:ring-3">
                <ChevronRight
                  className="size-4 shrink-0 transition-transform group-data-[state=open]/visit:rotate-90"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{item.visitDate}</span>
                  <span className="text-muted-foreground block text-xs">
                    {item.visitType.name} · {item.doctor.name}
                  </span>
                </span>
                <Badge
                  variant={visitStatusPresentation(item.status).variant}
                  className={cn(
                    item.status === 'COMPLETED' &&
                      'bg-success text-primary-foreground border-transparent'
                  )}
                >
                  {visitStatusPresentation(item.status).label}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 border-t p-2">
                {procedures.map((procedure) => (
                  <PreviousProcedure key={procedure.key} procedure={procedure} />
                ))}
                {visitNotes.length === 0 ? (
                  <p className="text-muted-foreground">No Clinical Notes on this Visit.</p>
                ) : (
                  visitNotes.map((note) =>
                    note.assessment || note.subjective ? (
                      <RichTextContent
                        key={note.id}
                        value={(note.assessment ?? note.subjective) as string}
                      />
                    ) : null
                  )
                )}
                <Link href={`/visits/${item.id}`} className="text-primary text-sm hover:underline">
                  Open {item.visitNumber}
                </Link>
              </CollapsibleContent>
            </Collapsible>
          );
        })
      )}
    </div>
  );
}
