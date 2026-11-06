'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useVisitsQuery } from '@/app/queries/visits/useVisits';
import { RichTextContent } from '@/components/clinical/rich-text-content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';

import { visitStatusPresentation } from '../../_utils/visit-status';

const RECENT_VISIT_LIMIT = 6;

export function VisitPreviousVisits({ visit, notes }: { visit: Visit; notes: ClinicalNote[] }) {
  const visitsQuery = useVisitsQuery({
    patientId: visit.patient.id,
    page: 1,
    limit: RECENT_VISIT_LIMIT,
  });
  const previous = (visitsQuery.data?.data ?? [])
    .filter((item) => item.id !== visit.id)
    .sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime());

  return (
    <Card className="shadow-fluent-2 gap-3">
      <CardHeader>
        <CardTitle className="text-base">Previous Visits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
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
                  <Badge variant={visitStatusPresentation(item.status).variant}>
                    {visitStatusPresentation(item.status).label}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 border-t p-2">
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
          })
        )}
      </CardContent>
    </Card>
  );
}
