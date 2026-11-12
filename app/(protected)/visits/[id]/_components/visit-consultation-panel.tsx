'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, NotebookPen, PlayCircle, Stethoscope } from 'lucide-react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { isAyurvedaBrand } from '@/components/brand/brand-config';
import { useBrandLogoVariant } from '@/components/brand/brand-provider';
import { RichTextContent } from '@/components/clinical/rich-text-content';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

import { isActiveVisit } from '../../_utils/visit-status';
import {
  CONSULTATION_STEP_IDS,
  consultationSteps,
  type ConsultationStepId,
} from '../_utils/consultation-steps';
import { SOAP_SECTIONS, soapToConsultation } from '../_utils/doctor-consultation-note';
import { VisitConsultationForm, type ConsultationStepSlots } from './visit-consultation-form';
import { STEP_LAYOUT, VisitStepShell } from './visit-step-shell';

function RecordedSection({ label, value }: { label: string; value: string }) {
  return (
    <section className="space-y-1 border-t pt-3 first:border-t-0 first:pt-0">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </h3>
      <RichTextContent value={value} />
    </section>
  );
}

function ConsultationSummary({ note, action }: { note: ClinicalNote; action?: React.ReactNode }) {
  const signed = note.status === 'signed';

  return (
    <Card className="shadow-fluent-2 gap-4">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Consultation note</CardTitle>
          <Badge variant={signed ? 'outline' : 'secondary'}>{signed ? 'Signed' : 'Draft'}</Badge>
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-4">
        {SOAP_SECTIONS.map(({ key, label }) => {
          const value = note[key];
          return value ? <RecordedSection key={key} label={label} value={value} /> : null;
        })}
      </CardContent>
    </Card>
  );
}

function VisitSummary({ visit }: { visit: Visit }) {
  const sections = [
    { label: 'Purpose of visit', value: visit.chiefComplaint },
    { label: 'Treatment', value: visit.treatment?.name },
    { label: 'Remarks', value: visit.remarks },
  ];

  return (
    <Card className="shadow-fluent-2 gap-4">
      <CardHeader>
        <CardTitle className="text-base">Visit summary</CardTitle>
        <CardDescription>No consultation note was recorded for this Visit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map(({ label, value }) =>
          value ? <RecordedSection key={label} label={label} value={value} /> : null
        )}
      </CardContent>
    </Card>
  );
}

function latest(notes: ClinicalNote[]) {
  return [...notes].sort((a, b) => b.id - a.id)[0];
}

function RecordedNote({
  visit,
  consultationNotes,
  canCreateNote,
  canStart,
  starting,
  onStart,
  onAddNote,
}: {
  visit: Visit;
  consultationNotes: ClinicalNote[];
  canCreateNote: boolean;
  canStart: boolean;
  starting: boolean;
  onStart: () => void;
  onAddNote: () => void;
}) {
  const inConsultation = visit.status === 'IN_CONSULTATION';
  const recorded =
    latest(consultationNotes.filter((note) => note.status === 'draft')) ??
    latest(consultationNotes.filter((note) => note.status === 'signed')) ??
    latest(consultationNotes);

  if (recorded) {
    return (
      <ConsultationSummary
        note={recorded}
        action={
          inConsultation && canCreateNote ? (
            <Button type="button" size="sm" variant="outline" onClick={onAddNote}>
              <NotebookPen className="size-4" />
              Add note
            </Button>
          ) : undefined
        }
      />
    );
  }

  // A closed Visit with no note, such as an imported one, may still hold details.
  if (!isActiveVisit(visit.status) && (visit.chiefComplaint || visit.treatment || visit.remarks)) {
    return <VisitSummary visit={visit} />;
  }

  return (
    <Empty className="bg-card shadow-fluent-2 min-h-72 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Stethoscope />
        </EmptyMedia>
        <EmptyTitle>
          {visit.status === 'CHECKED_IN'
            ? 'Consultation not started'
            : 'No consultation was recorded'}
        </EmptyTitle>
        <EmptyDescription>
          {visit.status === 'CHECKED_IN'
            ? canStart
              ? 'Start the consultation to open the note. Vital Signs can be recorded now.'
              : 'The Doctor starts the consultation when the Patient is called in.'
            : inConsultation
              ? 'You do not have permission to record a Clinical Note.'
              : `This Visit is closed without a consultation note.`}
        </EmptyDescription>
      </EmptyHeader>
      {visit.status === 'CHECKED_IN' && canStart ? (
        <EmptyContent>
          <Button type="button" disabled={starting} aria-busy={starting} onClick={onStart}>
            <PlayCircle className="size-4" />
            {starting ? 'Starting consultation…' : 'Start consultation'}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

export function VisitConsultationPanel({
  visit,
  notes,
  chartLoading,
  chartError,
  canCreateNote,
  canStart,
  starting,
  onStart,
  onAddNote,
  onDirtyChange,
  slots = {},
}: {
  visit: Visit;
  notes: ClinicalNote[];
  chartLoading: boolean;
  chartError: boolean;
  canCreateNote: boolean;
  canStart: boolean;
  starting: boolean;
  onStart: () => void;
  onAddNote: () => void;
  onDirtyChange: (dirty: boolean) => void;
  slots?: ConsultationStepSlots;
}) {
  const noteTypes = useClinicalNoteTypesQuery({ limit: 100 });
  const steps = consultationSteps(isAyurvedaBrand(useBrandLogoVariant()));
  // A Treatment Session Visit opens on today's Session; every other Visit on the complaint.
  const [stepId, setStepId] = useQueryState(
    'step',
    parseAsStringLiteral(CONSULTATION_STEP_IDS).withDefault(
      visit.treatmentSession ? 'plan' : 'subjective'
    )
  );
  const available = noteTypes.data?.data ?? [];
  const consultationType = available.find((type) => type.code === 'CONS');

  function goTo(id: ConsultationStepId) {
    void setStepId(id);
    // Start the new step at its heading once it is shown.
    requestAnimationFrame(() => {
      document.getElementById('consult-step-body')?.scrollTo?.({ top: 0 });
      document.getElementById(`consult-step-${id}`)?.focus({ preventScroll: true });
    });
  }

  if (chartLoading || noteTypes.isLoading) {
    return (
      <div className="space-y-4" aria-label="Loading consultation">
        {[120, 180, 140].map((height) => (
          <Skeleton key={height} className="w-full" style={{ height }} />
        ))}
      </div>
    );
  }

  // A note written outside this form stays a separate Clinical Note: only a
  // form-shaped draft can be resumed, so it never blocks the consultation.
  const consultationNotes = notes.filter(
    (note) => note.noteTypeId === consultationType?.id || soapToConsultation(note)
  );
  const draft = latest(
    consultationNotes.filter((note) => note.status === 'draft' && soapToConsultation(note))
  );
  const signed = latest(consultationNotes.filter((note) => note.status === 'signed'));
  const loadFailed = chartError || noteTypes.isError;
  const editable =
    !loadFailed &&
    available.length > 0 &&
    visit.status === 'IN_CONSULTATION' &&
    canCreateNote &&
    (draft || !signed);

  if (editable) {
    return (
      <VisitConsultationForm
        key={visit.id}
        visit={visit}
        noteTypes={available}
        defaultNoteTypeId={consultationType?.id ?? null}
        noteId={draft?.id ?? null}
        initialValues={draft ? soapToConsultation(draft) : null}
        onDirtyChange={onDirtyChange}
        steps={steps}
        stepId={stepId}
        onStepChange={goTo}
        slots={slots}
      />
    );
  }

  let aside: ReactNode;

  if (loadFailed) {
    aside = (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Consultation could not be loaded</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-2">
          Do not start a new note until this loads, or you may duplicate a saved draft.
          {noteTypes.isError ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void noteTypes.refetch()}
            >
              Retry
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  } else if (available.length === 0) {
    aside = (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>No Clinical Note Types configured</AlertTitle>
        <AlertDescription>
          <Link href="/clinical-masters/note-types" className="underline">
            Configure a Clinical Note Type
          </Link>{' '}
          before recording a consultation.
        </AlertDescription>
      </Alert>
    );
  } else {
    aside = (
      <RecordedNote
        visit={visit}
        consultationNotes={consultationNotes}
        canCreateNote={canCreateNote}
        canStart={canStart}
        starting={starting}
        onStart={onStart}
        onAddNote={onAddNote}
      />
    );
  }

  return (
    <div className={STEP_LAYOUT}>
      <VisitStepShell
        steps={steps}
        current={stepId}
        onSelect={goTo}
        renderStep={(id) =>
          slots[id] ?? (
            <p className="text-muted-foreground text-sm">Recorded in the consultation note.</p>
          )
        }
        aside={<div className="2xl:min-h-0 2xl:overflow-y-auto">{aside}</div>}
      />
    </div>
  );
}
