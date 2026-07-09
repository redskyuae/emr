'use client';

import Link from 'next/link';
import { AlertCircle, ClipboardList, Plus } from 'lucide-react';

import { VisitStatusBadge } from '@/app/(protected)/visits/_components/visit-status-badge';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useVisitsQuery } from '@/app/queries/visits/useVisits';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function formatCheckedInDate(createdOn: Date | string) {
  return new Date(createdOn).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PatientVisitsSection({
  patientId,
  patientIsActive,
}: {
  patientId: number;
  patientIsActive: boolean;
}) {
  const visitsQuery = useVisitsQuery({ page: 1, limit: 5, patientId });
  const visits = visitsQuery.data?.data ?? [];
  const hasOpenVisit = visits.some(
    (visit) => visit.status.category === 'WAITING' || visit.status.category === 'IN_PROGRESS'
  );

  const newVisitDisabled = !patientIsActive || hasOpenVisit;
  const disabledReason = !patientIsActive
    ? 'Inactive Patients cannot start a new Visit.'
    : hasOpenVisit
      ? 'This Patient already has an open Visit.'
      : null;

  const newVisitButton = (
    <Button type="button" size="sm" disabled={newVisitDisabled} asChild={!newVisitDisabled}>
      {newVisitDisabled ? (
        <span>
          <Plus className="size-4" />
          New Visit
        </span>
      ) : (
        <Link href={`/visits/new?patient=${patientId}`}>
          <Plus className="size-4" />
          New Visit
        </Link>
      )}
    </Button>
  );

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Visits</CardTitle>
        {disabledReason ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{newVisitButton}</span>
            </TooltipTrigger>
            <TooltipContent>{disabledReason}</TooltipContent>
          </Tooltip>
        ) : (
          newVisitButton
        )}
      </CardHeader>
      <CardContent className="p-0">
        {visitsQuery.isError ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Could not load Visits</AlertTitle>
              <AlertDescription>{getApiErrorMessage(visitsQuery.error)}</AlertDescription>
            </Alert>
          </div>
        ) : visitsQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-10 w-full" />
            ))}
          </div>
        ) : visits.length === 0 ? (
          <Empty className="min-h-48 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList className="size-5" />
              </EmptyMedia>
              <EmptyTitle>No Visits yet</EmptyTitle>
              <EmptyDescription>This Patient has no recorded Visits.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y">
            {visits.map((visit) => (
              <li key={visit.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link
                    href={`/visits/${visit.id}`}
                    className="hover:text-primary font-mono text-sm hover:underline"
                  >
                    {visit.visitNumber}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    {formatCheckedInDate(visit.createdOn)}
                    {visit.doctor ? ` · ${visit.doctor.name}` : ''}
                  </p>
                </div>
                <VisitStatusBadge status={visit.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
