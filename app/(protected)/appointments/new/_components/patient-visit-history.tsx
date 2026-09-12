import { CalendarDays, History, LoaderCircle, RefreshCw } from 'lucide-react';

import type { Visit, VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { Button } from '@/components/ui/button';
import { getRecentVisits } from '../_utils/patient-visit-history';
import { BookingStatusBadge } from './booking-status-badge';

const statusTone: Record<VisitStatus, 'success' | 'warning' | 'danger' | 'selected'> = {
  CHECKED_IN: 'warning',
  IN_CONSULTATION: 'selected',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const statusLabel: Record<VisitStatus, string> = {
  CHECKED_IN: 'Checked In',
  IN_CONSULTATION: 'In Consultation',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function PatientVisitHistory({
  visits,
  isLoading,
  error,
  onRetry,
}: {
  visits: Visit[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const recentVisits = getRecentVisits(visits);

  return (
    <section className="overflow-hidden rounded-lg border" aria-labelledby="previous-visits-title">
      <div className="bg-muted/35 flex items-center justify-between gap-3 border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <History className="text-primary size-4" aria-hidden="true" />
          <h3 id="previous-visits-title" className="text-sm font-semibold">
            Previous Visits
          </h3>
        </div>
        {!isLoading && !error ? (
          <span className="text-muted-foreground text-xs">
            {visits.length} {visits.length === 1 ? 'Visit' : 'Visits'}
          </span>
        ) : null}
      </div>
      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 px-3 py-4 text-sm">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Loading previous Visits…
        </div>
      ) : error ? (
        <div className="border-destructive/20 bg-destructive/5 px-3 py-3 text-sm">
          <p>{error}</p>
          <Button type="button" size="sm" variant="outline" className="mt-2" onClick={onRetry}>
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        </div>
      ) : recentVisits.length ? (
        <div className="divide-y">
          {recentVisits.map((visit) => {
            const date = new Date(visit.checkedInAt);
            return (
              <article
                key={visit.id}
                className="hover:bg-muted/25 grid gap-2 px-3 py-2.5 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-medium">{visit.visitType.name}</p>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {visit.visitNumber}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs">
                    <CalendarDays className="size-3" aria-hidden="true" />
                    <time dateTime={date.toISOString()}>
                      {date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      ·{' '}
                      {date.toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </time>
                    <span aria-hidden="true">·</span>
                    <span>{visit.doctor.name}</span>
                  </p>
                </div>
                <BookingStatusBadge tone={statusTone[visit.status]}>
                  {statusLabel[visit.status]}
                </BookingStatusBadge>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-muted-foreground flex items-center gap-2 px-3 py-4 text-sm">
          <CalendarDays className="size-4" aria-hidden="true" />
          No previous Visits for this Patient.
        </div>
      )}
    </section>
  );
}
