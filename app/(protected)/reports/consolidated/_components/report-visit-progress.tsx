import type { ConsolidatedReportVisit } from '@/app/api/lib/modules/consolidated-patient-report/schemas/consolidated-patient-report-schema';
import { RichTextContent } from '@/components/clinical/rich-text-content';

import { displayDate, noteText, sessionText } from '../../_utils/consolidated-report-format';
import { ReportSectionHeading, ReportTable } from './report-document-parts';

function TreatmentDetails({ visit }: { visit: ConsolidatedReportVisit }) {
  if (visit.treatments.length === 0) {
    return visit.chiefComplaint ? (
      <>Consultation. {visit.chiefComplaint}</>
    ) : (
      <span className="text-muted-foreground">Consultation.</span>
    );
  }

  return (
    <ul className="space-y-0.5">
      {visit.treatments.map((treatment) => (
        <li key={`${treatment.planId}:${treatment.sessionNumber}`}>{sessionText(treatment)}</li>
      ))}
    </ul>
  );
}

function ProgressNotes({ visit }: { visit: ConsolidatedReportVisit }) {
  const notes = visit.notes.filter((note) => noteText(note));
  const authors = [...new Set(notes.map((note) => note.authorName).filter(Boolean))];

  if (visit.painScore === null && notes.length === 0) {
    return <span className="text-muted-foreground">No signed note.</span>;
  }

  return (
    <>
      {visit.painScore !== null ? (
        <span className="block font-medium">Pain {visit.painScore}/10.</span>
      ) : null}
      {notes.length > 0 ? (
        <div className="space-y-1.5">
          {notes.map((note) => (
            // Clinical Notes are written as rich text (markdown), so they print formatted.
            <RichTextContent
              key={note.id}
              value={noteText(note)}
              className="text-[11.5px] whitespace-normal [&_p+p]:mt-1"
            />
          ))}
        </div>
      ) : null}
      {authors.length > 0 ? (
        <span className="text-muted-foreground mt-1 block text-[10.5px]">
          Recorded by {authors.join(', ')}
        </span>
      ) : null}
    </>
  );
}

/** One row per Visit in the period: Sessions given, and the progress the Doctor signed. */
export function ReportVisitProgress({ visits }: { visits: ConsolidatedReportVisit[] }) {
  return (
    <section>
      <ReportSectionHeading
        title="Visit-wise treatment and progress"
        aside={`${visits.length} ${visits.length === 1 ? 'Visit' : 'Visits'}`}
      />
      {visits.length === 0 ? (
        <p className="text-muted-foreground border-border border border-dashed px-3 py-4 text-center text-[12px]">
          No Visits in this period.
        </p>
      ) : (
        <ReportTable
          headClassName="bg-primary text-primary-foreground"
          head={[
            { label: 'Visit date', className: 'w-[14%]' },
            { label: 'Visit', className: 'w-[13%]' },
            { label: 'Treatment details', className: 'w-[36%]' },
            { label: 'Progress notes' },
          ]}
          rows={visits.map((visit, index) => [
            displayDate(visit.visitDate),
            <>
              <span className="block font-semibold">Visit {index + 1}</span>
              <span className="text-muted-foreground font-mono text-[10.5px]">
                {visit.visitNumber}
              </span>
            </>,
            <TreatmentDetails key="treatment" visit={visit} />,
            <ProgressNotes key="progress" visit={visit} />,
          ])}
        />
      )}
    </section>
  );
}
