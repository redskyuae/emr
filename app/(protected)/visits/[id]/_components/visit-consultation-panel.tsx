'use client';

import Link from 'next/link';
import { AlertCircle, NotebookPen, PlayCircle, Stethoscope } from 'lucide-react';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { RichTextContent } from '@/components/clinical/rich-text-content';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

import { SOAP_SECTIONS, soapToConsultation } from '../_utils/doctor-consultation-note';
import { VisitConsultationForm } from './visit-consultation-form';

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
          return value ? (
            <section key={key} className="space-y-1 border-t pt-3 first:border-t-0 first:pt-0">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {label}
              </h3>
              <RichTextContent value={value} />
            </section>
          ) : null;
        })}
      </CardContent>
    </Card>
  );
}

function latest(notes: ClinicalNote[]) {
  return [...notes].sort((a, b) => b.id - a.id)[0];
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
}) {
  const noteTypes = useClinicalNoteTypesQuery({ limit: 100 });
  const available = noteTypes.data?.data ?? [];
  const consultationType = available.find((type) => type.code === 'CONS');

  if (chartLoading || noteTypes.isLoading) {
    return (
      <div className="space-y-4" aria-label="Loading consultation">
        {[120, 180, 140].map((height) => (
          <Skeleton key={height} className="w-full" style={{ height }} />
        ))}
      </div>
    );
  }

  if (chartError || noteTypes.isError) {
    return (
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
  }

  if (available.length === 0) {
    return (
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
  const draftValues = draft ? soapToConsultation(draft) : null;
  const inConsultation = visit.status === 'IN_CONSULTATION';

  if (inConsultation && canCreateNote && (draft || !signed)) {
    return (
      <VisitConsultationForm
        key={visit.id}
        visit={visit}
        noteTypes={available}
        defaultNoteTypeId={consultationType?.id ?? null}
        noteId={draft?.id ?? null}
        initialValues={draftValues}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  const recorded = draft ?? signed ?? latest(consultationNotes);

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
