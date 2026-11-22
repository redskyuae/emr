import { CiEdit, CiMemoPad } from 'react-icons/ci';
import { PiNotePencilDuotone } from 'react-icons/pi';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { RichTextContent } from '@/components/clinical/rich-text-content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { SOAP_SECTIONS } from '../_utils/doctor-consultation-note';

/** Every Clinical Note written during this Visit, including nursing notes. */
function amendedLabel(note: ClinicalNote, timeZone?: string) {
  if (!note.amendedAt) {
    return null;
  }

  const when = new Date(note.amendedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  });

  return `Amended by ${note.amendedByUserName ?? 'a former user'} on ${when}`;
}

// Mirrors a Clinical Note row: Note Type beside its status badge, then two SOAP sections.
function ClinicalNoteListSkeleton() {
  return (
    <ul className="space-y-2" aria-label="Loading Clinical Notes">
      {Array.from({ length: 2 }, (_, index) => (
        <li key={index} className="rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="mt-2 space-y-2">
            {Array.from({ length: 2 }, (_, section) => (
              <div key={section} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function VisitClinicalNotesCard({
  notes,
  timeZone,
  loading,
  error,
  active,
  canCreateNote,
  onAddClinicalNote,
  onNursingHandoff,
  onSignNote,
  onAmendNote,
}: {
  notes: ClinicalNote[];
  /** The Tenant's time zone, used for the amendment time. */
  timeZone?: string;
  loading: boolean;
  error: boolean;
  active: boolean;
  canCreateNote: boolean;
  onAddClinicalNote: () => void;
  onNursingHandoff: () => void;
  onSignNote: (note: ClinicalNote) => void;
  /** Present only on a Completed Visit the user may amend. */
  onAmendNote?: (noteId: number) => void;
}) {
  const noteTypesQuery = useClinicalNoteTypesQuery({ limit: 100 });
  const noteTypeName = (id: number) =>
    noteTypesQuery.data?.data.find((item) => item.id === id)?.name ?? 'Clinical Note';
  const notesLoading = loading || noteTypesQuery.isLoading;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">Clinical Notes this Visit</CardTitle>
        {active && canCreateNote ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onNursingHandoff}>
              Nursing handoff
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onAddClinicalNote}>
              <CiMemoPad className="size-4" />
              Add note
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {error && !notesLoading ? (
          <p className="text-destructive text-sm">Clinical Notes could not be loaded.</p>
        ) : (
          <SkeletonCrossfade isLoading={notesLoading} skeleton={<ClinicalNoteListSkeleton />}>
            {notes.length === 0 ? (
              <EmptyState
                size="sm"
                tone="blue"
                title="No Clinical Notes yet"
                icon={PiNotePencilDuotone}
                description="No Clinical Notes authored during this Visit."
              />
            ) : (
              <ul className="space-y-2 text-sm">
                {notes.map((note) => {
                  const amended = amendedLabel(note, timeZone);

                  return (
                    <li key={note.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{noteTypeName(note.noteTypeId)}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={note.status === 'signed' ? 'outline' : 'secondary'}>
                            {note.status === 'signed' ? 'Signed' : 'Draft'}
                          </Badge>
                          {note.status === 'draft' && canCreateNote ? (
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              onClick={() => onSignNote(note)}
                            >
                              Sign
                            </Button>
                          ) : null}
                          {onAmendNote ? (
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              aria-label={`Amend ${noteTypeName(note.noteTypeId)}`}
                              onClick={() => onAmendNote(note.id)}
                            >
                              <CiEdit className="size-3" />
                              Amend
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      {amended ? (
                        <p className="text-muted-foreground mt-1 text-xs">{amended}</p>
                      ) : null}
                      <dl className="mt-2 space-y-2">
                        {SOAP_SECTIONS.map(({ key, label }) => {
                          const value = note[key];

                          return value ? (
                            <div key={key}>
                              <dt className="text-xs font-semibold">{label}</dt>
                              <dd>
                                <RichTextContent value={value} className="text-muted-foreground" />
                              </dd>
                            </div>
                          ) : null;
                        })}
                      </dl>
                    </li>
                  );
                })}
              </ul>
            )}
          </SkeletonCrossfade>
        )}
      </CardContent>
    </Card>
  );
}
