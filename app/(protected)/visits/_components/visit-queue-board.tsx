'use client';

import Link from 'next/link';
import { AlertCircle, Play, Square, User, X } from 'lucide-react';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useVisitsQuery } from '@/app/queries/visits/useVisits';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

type QueueColumnProps = {
  title: string;
  visits: Visit[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onStart?: (visit: Visit) => void;
  onComplete?: (visit: Visit) => void;
  onCancel: (visit: Visit) => void;
};

function QueueCard({
  visit,
  onStart,
  onComplete,
  onCancel,
}: {
  visit: Visit;
  onStart?: (visit: Visit) => void;
  onComplete?: (visit: Visit) => void;
  onCancel: (visit: Visit) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/patients/${visit.patient.id}`}
              className="hover:text-primary block truncate font-medium hover:underline"
            >
              {visit.patient.name}
            </Link>
            <p className="text-muted-foreground font-mono text-xs">{visit.patient.mrn}</p>
          </div>
          <Link
            href={`/visits/${visit.id}`}
            className="text-muted-foreground hover:text-primary shrink-0 font-mono text-xs hover:underline"
          >
            {visit.visitNumber}
          </Link>
        </div>

        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <User className="size-3.5" />
          {visit.doctor?.name ?? 'Unassigned'}
        </div>

        {visit.chiefComplaint ? (
          <p className="text-muted-foreground truncate text-xs">{visit.chiefComplaint}</p>
        ) : null}

        <div className="flex gap-2 border-t pt-2">
          {onStart ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => onStart(visit)}>
              <Play className="size-3.5" />
              Start
            </Button>
          ) : null}
          {onComplete ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => onComplete(visit)}>
              <Square className="size-3.5" />
              Complete
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onCancel(visit)}
          >
            <X className="size-3.5" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QueueColumn({
  title,
  visits,
  isLoading,
  isError,
  error,
  onStart,
  onComplete,
  onCancel,
}: QueueColumnProps) {
  return (
    <div className="flex min-w-72 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="font-heading text-sm font-semibold">{title}</h2>
        <span className="text-muted-foreground text-xs">{visits.length}</span>
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load</AlertTitle>
          <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-28 w-full" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <Empty className="bg-card/50 min-h-32 border border-dashed">
          <EmptyMedia variant="icon">
            <User className="size-4" />
          </EmptyMedia>
          <EmptyTitle className="text-sm">No visits</EmptyTitle>
          <EmptyDescription className="text-xs">Nobody is in this queue.</EmptyDescription>
        </Empty>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => (
            <QueueCard
              key={visit.id}
              visit={visit}
              onStart={onStart}
              onComplete={onComplete}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type VisitQueueBoardProps = {
  doctorId?: number;
  onStart: (visit: Visit) => void;
  onComplete: (visit: Visit) => void;
  onCancel: (visit: Visit) => void;
};

export function VisitQueueBoard({ doctorId, onStart, onComplete, onCancel }: VisitQueueBoardProps) {
  const waitingQuery = useVisitsQuery({
    page: 1,
    limit: 50,
    statusCategory: 'WAITING',
    doctorId,
  });
  const inProgressQuery = useVisitsQuery({
    page: 1,
    limit: 50,
    statusCategory: 'IN_PROGRESS',
    doctorId,
  });

  // The list API returns newest-first; a queue reads naturally oldest-first (FIFO).
  const waitingVisits = [...(waitingQuery.data?.data ?? [])].reverse();
  const inProgressVisits = [...(inProgressQuery.data?.data ?? [])].reverse();

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="pb-0">
        <CardTitle className="sr-only">Visit queue</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
        <QueueColumn
          title="Waiting"
          visits={waitingVisits}
          isLoading={waitingQuery.isLoading}
          isError={waitingQuery.isError}
          error={waitingQuery.error}
          onStart={onStart}
          onCancel={onCancel}
        />
        <QueueColumn
          title="In Progress"
          visits={inProgressVisits}
          isLoading={inProgressQuery.isLoading}
          isError={inProgressQuery.isError}
          error={inProgressQuery.error}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      </CardContent>
    </Card>
  );
}
