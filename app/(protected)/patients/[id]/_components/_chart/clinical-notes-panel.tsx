'use client';

import { FileText } from 'lucide-react';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { formatChartDate } from '../../_utils/chart-value-sets';
import { ChartPanel, ChartPanelEmpty, ChartRowActions } from './chart-panel';

const SOAP_SECTIONS: { key: keyof ClinicalNote; label: string }[] = [
  { key: 'subjective', label: 'S' },
  { key: 'objective', label: 'O' },
  { key: 'assessment', label: 'A' },
  { key: 'plan', label: 'P' },
];

function NoteCard({
  note,
  noteTypeName,
  isSigning,
  onEdit,
  onDelete,
  onSign,
}: {
  note: ClinicalNote;
  noteTypeName: (id: number) => string;
  isSigning: boolean;
  onEdit: (note: ClinicalNote) => void;
  onDelete: (note: ClinicalNote) => void;
  onSign: (note: ClinicalNote) => void;
}) {
  const isSigned = note.status === 'signed';

  return (
    <li className="border-border/60 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{noteTypeName(note.noteTypeId)}</span>
            <Badge
              variant="outline"
              className={cn(
                isSigned
                  ? 'border-chart-4/20 bg-chart-4/10 text-chart-4'
                  : 'bg-muted/60 text-muted-foreground'
              )}
            >
              {isSigned ? 'Signed' : 'Draft'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            {isSigned && note.signedAt
              ? `Signed ${formatChartDate(String(note.signedAt))}`
              : `Created ${formatChartDate(String(note.createdOn))}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!isSigned ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSigning}
              aria-busy={isSigning}
              onClick={() => onSign(note)}
            >
              Sign
            </Button>
          ) : null}
          <ChartRowActions
            onEdit={isSigned ? undefined : () => onEdit(note)}
            onDelete={isSigned ? undefined : () => onDelete(note)}
          />
        </div>
      </div>

      <dl className="mt-2 space-y-1">
        {SOAP_SECTIONS.map((section) => {
          const value = note[section.key];
          if (typeof value !== 'string' || value.trim() === '') {
            return null;
          }
          return (
            <div key={section.label} className="flex gap-2 text-sm">
              <dt className="text-muted-foreground w-5 shrink-0 font-semibold">{section.label}</dt>
              <dd className="whitespace-pre-wrap">{value}</dd>
            </div>
          );
        })}
      </dl>
    </li>
  );
}

export function ClinicalNotesPanel({
  notes,
  noteTypeName,
  signingNoteId,
  onAdd,
  onEdit,
  onDelete,
  onSign,
}: {
  notes: ClinicalNote[];
  noteTypeName: (id: number) => string;
  signingNoteId: number | null;
  onAdd: () => void;
  onEdit: (note: ClinicalNote) => void;
  onDelete: (note: ClinicalNote) => void;
  onSign: (note: ClinicalNote) => void;
}) {
  return (
    <ChartPanel
      title="Clinical Notes"
      icon={<FileText className="size-4" />}
      count={notes.length}
      addLabel="New Note"
      onAdd={onAdd}
    >
      {notes.length === 0 ? (
        <ChartPanelEmpty message="No clinical notes recorded." />
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              noteTypeName={noteTypeName}
              isSigning={signingNoteId === note.id}
              onEdit={onEdit}
              onDelete={onDelete}
              onSign={onSign}
            />
          ))}
        </ul>
      )}
    </ChartPanel>
  );
}
