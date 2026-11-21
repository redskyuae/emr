'use client';

import Link from 'next/link';
import { PiCaretRightLight } from 'react-icons/pi';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useVisitsQuery } from '@/app/queries/visits/useVisits';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { RichTextContent } from '@/components/clinical/rich-text-content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { visitStatusPresentation } from '../../_utils/visit-status';
import { visitProcedures } from '../_utils/visit-treatment-plan';
import { VisitProcedureCard } from './visit-procedure-card';
import { visitDoctorLabel } from '@/lib/visit-doctor-label';

const RECENT_VISIT_LIMIT = 6;

// Mirrors a collapsed earlier Visit: caret, date over the Visit Type and Doctor line, status badge.
function PreviousVisitsSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading previous Visits">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center gap-2 rounded-md border p-2">
          <Skeleton className="size-4 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40 max-w-full" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
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
      {visitsQuery.isError ? (
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
      ) : (
        <SkeletonCrossfade isLoading={visitsQuery.isLoading} skeleton={<PreviousVisitsSkeleton />}>
          {previous.length === 0 ? (
            <p className="text-muted-foreground">No earlier Visits for this Patient.</p>
          ) : (
            <div className="space-y-2">
              {previous.map((item) => {
                const visitNotes = notes.filter((note) => note.visitId === item.id);
                const procedures = visitProcedures(item, plans);

                return (
                  <Collapsible key={item.id} className="group/visit rounded-lg border">
                    <CollapsibleTrigger className="hover:bg-accent focus-visible:ring-ring/50 flex w-full items-start gap-2 rounded-lg p-2.5 text-left outline-none focus-visible:ring-3">
                      <PiCaretRightLight
                        className="mt-1 size-4 shrink-0 transition-transform group-data-[state=open]/visit:rotate-90"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium">{item.visitDate}</span>
                          <Badge
                            variant={visitStatusPresentation(item.status).variant}
                            className={cn(
                              item.status === 'COMPLETED' &&
                                'bg-success text-primary-foreground border-transparent'
                            )}
                          >
                            {visitStatusPresentation(item.status).label}
                          </Badge>
                        </span>
                        <span className="text-muted-foreground mt-0.5 block text-xs">
                          {item.visitType.name} · {visitDoctorLabel(item)}
                        </span>
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 border-t p-2.5">
                      {procedures.map((procedure) => (
                        <VisitProcedureCard key={procedure.key} procedure={procedure} />
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
                      <Link
                        href={`/visits/${item.id}`}
                        className="text-primary text-sm hover:underline"
                      >
                        Open {item.visitNumber}
                      </Link>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </SkeletonCrossfade>
      )}
    </div>
  );
}
