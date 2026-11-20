import type { ReactNode } from 'react';

import type { VisitSummary } from '@/app/api/lib/modules/visit/schemas/visit-summary-schema';
import { cn } from '@/lib/utils';

import { dateTimeIn } from '../_utils/visit-summary-format';
import { type ConsultationGroup, consultationGroups } from '../_utils/visit-summary-notes';
import { SummarySectionHeading } from './summary-section';

/**
 * A piece of the Patient copy that is placed whole on one page. `spacing` is the room above it:
 * a new section, a new SOAP group or note, or the next row of the same group. `continued` is
 * printed above the block when it starts a later page, so the reader can tell what it continues.
 */
export type SummaryBlock = {
  key: string;
  node: ReactNode;
  continued?: ReactNode;
  spacing: 'section' | 'group' | 'row';
};

type SummaryNote = VisitSummary['notes'][number];

const GROUP_STYLE: Record<ConsultationGroup['key'], { title: string; className: string }> = {
  subjective: { title: 'Subjective', className: 'text-primary' },
  objective: { title: 'Objective', className: 'text-chart-4' },
  assessment: { title: 'Assessment', className: 'text-pop' },
  plan: { title: 'Plan', className: 'text-procedure' },
};

function GroupHeading({ group }: { group: ConsultationGroup['key'] }) {
  return (
    <h3
      className={cn(
        'text-[11.5px] font-bold tracking-[0.12em] uppercase',
        GROUP_STYLE[group].className
      )}
    >
      {GROUP_STYLE[group].title}
    </h3>
  );
}

// Names the note (and SOAP group) a block belongs to when it opens a new page.
function ContinuedHeading({ title, group }: { title: string; group?: ConsultationGroup['key'] }) {
  return (
    <div className="flex items-baseline gap-2">
      {group ? <GroupHeading group={group} /> : null}
      <p className="text-muted-foreground text-[11px] italic">{title} (continued)</p>
    </div>
  );
}

// A free-text section has no label, so its text takes the full width.
function NoteRow({ label, value }: { label: string; value: string }) {
  if (!label) {
    return <p className="text-[13px] leading-snug whitespace-pre-line">{value}</p>;
  }

  return (
    <dl className="grid grid-cols-[10.5rem_1fr] gap-x-4 text-[13px] leading-snug">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-line">{value}</dd>
    </dl>
  );
}

/**
 * One block per row of each SOAP group, so a long note continues on the next page instead of
 * moving there whole. `lead` (a section or note heading) and each group heading travel with
 * the first row under them, so a heading is never left alone at the bottom of a page.
 */
function noteBodyBlocks(
  key: string,
  title: string,
  groups: ConsultationGroup[],
  lead: ReactNode,
  leadSpacing: SummaryBlock['spacing']
): SummaryBlock[] {
  return groups.flatMap((group, groupIndex) =>
    group.rows.map((row, rowIndex): SummaryBlock => {
      const blockKey = `${key}-${group.key}-${rowIndex}`;
      const rowNode = <NoteRow label={row.label} value={row.value} />;

      if (rowIndex > 0) {
        return {
          key: blockKey,
          node: rowNode,
          spacing: 'row',
          continued: <ContinuedHeading title={title} group={group.key} />,
        };
      }

      const opening = (
        <>
          <GroupHeading group={group.key} />
          <div className="mt-1.5">{rowNode}</div>
        </>
      );

      if (groupIndex > 0) {
        return {
          key: blockKey,
          node: opening,
          spacing: 'group',
          continued: <ContinuedHeading title={title} />,
        };
      }

      return {
        key: blockKey,
        spacing: leadSpacing,
        node: (
          <>
            {lead}
            <div className="mt-3">{opening}</div>
          </>
        ),
      };
    })
  );
}

/** The Consultation section: the signed consultation note, or the chief complaint at check-in. */
export function consultationBlocks({
  note,
  chiefComplaint,
  timeZone,
}: {
  note: SummaryNote | null;
  chiefComplaint: string | null;
  timeZone: string;
}): SummaryBlock[] {
  const groups: ConsultationGroup[] = note
    ? consultationGroups(note)
    : [{ key: 'subjective', rows: [{ label: 'Chief complaint', value: chiefComplaint ?? '' }] }];

  const heading = (
    <SummarySectionHeading
      title="Consultation"
      aside={note ? `${note.noteType.name} note · signed` : 'Chief complaint at check-in'}
    />
  );

  const blocks = noteBodyBlocks('consultation', 'Consultation', groups, heading, 'section');

  if (note) {
    blocks.push({
      key: 'consultation-signature',
      spacing: 'group',
      continued: <ContinuedHeading title="Consultation" />,
      node: (
        <div className="border-border flex items-center justify-between gap-3 border-t border-dashed pt-3 text-[12px]">
          <p className="text-muted-foreground">
            Signed by{' '}
            <span className="text-foreground font-semibold">{note.authorName ?? 'Unknown'}</span>
          </p>
          {note.signedAt ? (
            <p className="text-muted-foreground font-mono">{dateTimeIn(note.signedAt, timeZone)}</p>
          ) : null}
        </div>
      ),
    });
  }

  return blocks;
}

function NoteHeading({ note, timeZone }: { note: SummaryNote; timeZone: string }) {
  return (
    <div className="border-border flex items-baseline justify-between gap-3 border-b border-dashed pb-1.5 text-[12px]">
      <p className="text-[13px] font-semibold">{note.noteType.name}</p>
      <p className="text-muted-foreground">
        Signed by{' '}
        <span className="text-foreground font-semibold">{note.authorName ?? 'Unknown'}</span>
        {note.signedAt ? (
          <span className="font-mono"> · {dateTimeIn(note.signedAt, timeZone)}</span>
        ) : null}
      </p>
    </div>
  );
}

/** The Clinical notes section: each other signed note of the Visit, under its type and signer. */
export function clinicalNoteBlocks({
  notes,
  timeZone,
}: {
  notes: SummaryNote[];
  timeZone: string;
}): SummaryBlock[] {
  const printable = notes
    .map((note) => ({ note, groups: consultationGroups(note) }))
    .filter(({ groups }) => groups.length > 0);

  return printable.flatMap(({ note, groups }, index) => {
    const heading = <NoteHeading note={note} timeZone={timeZone} />;
    const lead =
      index === 0 ? (
        <>
          <SummarySectionHeading title="Clinical notes" aside="Signed during this Visit" />
          <div className="mt-3">{heading}</div>
        </>
      ) : (
        heading
      );

    return noteBodyBlocks(`note-${note.id}`, note.noteType.name, groups, lead, 'section');
  });
}
