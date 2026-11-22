'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { CiCircleAlert, CiEdit, CiMemoPad } from 'react-icons/ci';
import { PiPlayCircleLight, PiStethoscopeDuotone } from 'react-icons/pi';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { isAyurvedaBrand } from '@/components/brand/brand-config';
import { useBrandLogoVariant } from '@/components/brand/brand-provider';
import { RichTextContent } from '@/components/clinical/rich-text-content';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { isActiveVisit } from '../../_utils/visit-status';
import {
  CONSULTATION_STEP_IDS,
  consultationSteps,
  type ConsultationStepId,
} from '../_utils/consultation-steps';
import { SOAP_SECTIONS, soapToConsultation } from '../_utils/doctor-consultation-note';
import { useConsultationStepAnalytics } from './use-consultation-step-analytics';
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
    <Card className="gap-4">
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

function VisitSummary({ visit, onAmend }: { visit: Visit; onAmend?: () => void }) {
  const sections = [
    { label: 'Purpose of visit', value: visit.chiefComplaint },
    { label: 'Treatment', value: visit.treatment?.name },
    { label: 'Remarks', value: visit.remarks },
  ];

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Visit summary</CardTitle>
          <CardDescription>No consultation note was recorded for this Visit.</CardDescription>
        </div>
        {onAmend ? (
          <Button type="button" size="sm" variant="outline" onClick={onAmend}>
            <CiEdit className="size-4" />
            Amend
          </Button>
        ) : null}
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
  onAmendVisit,
  onAmendNote,
}: {
  visit: Visit;
  consultationNotes: ClinicalNote[];
  canCreateNote: boolean;
  canStart: boolean;
  starting: boolean;
  onStart: () => void;
  onAddNote: () => void;
  onAmendVisit?: () => void;
  onAmendNote?: (noteId: number) => void;
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
              <CiMemoPad className="size-4" />
              Add note
            </Button>
          ) : onAmendNote ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onAmendNote(recorded.id)}
            >
              <CiEdit className="size-4" />
              Amend note
            </Button>
          ) : undefined
        }
      />
    );
  }

  // A closed Visit with no note, such as an imported one, may still hold details.
  if (!isActiveVisit(visit.status) && (visit.chiefComplaint || visit.treatment || visit.remarks)) {
    return <VisitSummary visit={visit} onAmend={onAmendVisit} />;
  }

  return (
    <EmptyState
      size="md"
      tone="blue"
      icon={PiStethoscopeDuotone}
      className="bg-card min-h-72 border"
      title={
        visit.status === 'CHECKED_IN' ? 'Consultation not started' : 'No consultation was recorded'
      }
      description={
        visit.status === 'CHECKED_IN'
          ? canStart
            ? 'Start the consultation to open the note. Vital Signs can be recorded now.'
            : 'The Doctor starts the consultation when the Patient is called in.'
          : inConsultation
            ? 'You do not have permission to record a Clinical Note.'
            : `This Visit is closed without a consultation note.`
      }
      actions={
        visit.status === 'CHECKED_IN' && canStart ? (
          <Button type="button" disabled={starting} aria-busy={starting} onClick={onStart}>
            <PiPlayCircleLight className="size-4" />
            {starting ? 'Starting consultation…' : 'Start consultation'}
          </Button>
        ) : null
      }
    />
  );
}

// Mirrors the consultation shell: the step track on the page, then the step card with the
// current step's heading and fields and the Back / Continue footer. The Visit loader shows it too.
export function ConsultationSkeleton({ stepCount }: { stepCount: number }) {
  return (
    <div className={STEP_LAYOUT} aria-label="Loading consultation">
      <div className="bg-card ring-border flex h-10 flex-none items-center gap-0.5 overflow-hidden rounded-full p-1 ring-1 2xl:col-span-full">
        {Array.from({ length: stepCount }, (_, index) => (
          <div key={index} className="flex flex-1 items-center justify-center gap-2 px-3.5">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      <section className="bg-card flex flex-col rounded-xl border xl:min-h-0 xl:flex-1">
        <div className="flex-1 space-y-4 p-5 xl:min-h-0">
          <div className="flex items-start gap-3">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
          </div>
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-b-xl border-t p-3">
          <div className="min-w-0 flex-1 px-1">
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-9 w-48" />
        </div>
      </section>
    </div>
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
  onAmendVisit,
  onAmendNote,
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
  onAmendVisit?: () => void;
  onAmendNote?: (noteId: number) => void;
  onDirtyChange: (dirty: boolean) => void;
  slots?: ConsultationStepSlots;
}) {
  const noteTypes = useClinicalNoteTypesQuery({ limit: 100 });
  const showAyurveda = isAyurvedaBrand(useBrandLogoVariant());
  const steps = consultationSteps(showAyurveda);
  const loading = chartLoading || noteTypes.isLoading;
  // A Treatment Session Visit opens on today's Session; every other Visit on the complaint.
  const [stepId, setStepId] = useQueryState(
    'step',
    parseAsStringLiteral(CONSULTATION_STEP_IDS).withDefault(
      visit.treatmentSession ? 'plan' : 'subjective'
    )
  );
  useConsultationStepAnalytics({
    stepId,
    visitStatus: visit.status,
    isAyurvedaBrand: showAyurveda,
  });
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

  let aside: ReactNode;

  if (loadFailed) {
    aside = (
      <Alert variant="destructive">
        <CiCircleAlert className="size-4" />
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
        <CiCircleAlert className="size-4" />
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
        onAmendVisit={onAmendVisit}
        onAmendNote={onAmendNote}
      />
    );
  }

  // The panel fills the cockpit's height from xl, so the crossfade passes that height through.
  return (
    <SkeletonCrossfade
      isLoading={loading}
      skeleton={<ConsultationSkeleton stepCount={steps.length} />}
      className="xl:h-full xl:*:h-full"
    >
      {editable ? (
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
      ) : (
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
      )}
    </SkeletonCrossfade>
  );
}
