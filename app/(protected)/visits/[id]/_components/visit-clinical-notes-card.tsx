import { NotebookPen } from 'lucide-react';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { RichTextContent } from '@/components/clinical/rich-text-content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { SOAP_SECTIONS } from '../_utils/doctor-consultation-note';

/** Every Clinical Note written during this Visit, including nursing notes. */
export function VisitClinicalNotesCard({
  notes,
  loading,
  error,
  active,
  canCreateNote,
  onAddClinicalNote,
  onNursingHandoff,
  onSignNote,
}: {
  notes: ClinicalNote[];
  loading: boolean;
  error: boolean;
  active: boolean;
  canCreateNote: boolean;
  onAddClinicalNote: () => void;
  onNursingHandoff: () => void;
  onSignNote: (note: ClinicalNote) => void;
}) {
  const noteTypesQuery = useClinicalNoteTypesQuery({ limit: 100 });
  const noteTypeName = (id: number) =>
    noteTypesQuery.data?.data.find((item) => item.id === id)?.name ?? 'Clinical Note';

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">Clinical Notes this Visit</CardTitle>
        {active && canCreateNote ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onNursingHandoff}>
              Nursing handoff
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onAddClinicalNote}>
              <NotebookPen className="size-4" />
              Add note
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading || noteTypesQuery.isLoading ? (
          <div className="space-y-2" aria-label="Loading Clinical Notes">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-3/4" />
          </div>
        ) : error ? (
          <p className="text-destructive text-sm">Clinical Notes could not be loaded.</p>
        ) : notes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No Clinical Notes authored during this Visit.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {notes.map((note) => (
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
                  </div>
                </div>
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
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
