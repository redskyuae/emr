import { CalendarDays, History } from 'lucide-react';

import { BookingStatusBadge } from './booking-status-badge';
import { getRecentVisits } from '../_utils/patient-visit-history';

import type { DemoVisit } from './book-appointment-demo-data';

const statusTone: Record<DemoVisit['status'], 'success' | 'warning' | 'danger' | 'selected'> = {
  'Checked In': 'warning',
  'In Consultation': 'selected',
  Completed: 'success',
  Cancelled: 'danger',
};

export function PatientVisitHistory({ visits }: { visits: DemoVisit[] }) {
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
        <span className="text-muted-foreground text-xs">
          {visits.length} {visits.length === 1 ? 'Visit' : 'Visits'}
        </span>
      </div>
      {recentVisits.length ? (
        <div className="divide-y">
          {recentVisits.map((visit) => {
            const date = new Date(visit.occurredAt);
            return (
              <article
                key={visit.id}
                className="hover:bg-muted/25 grid gap-2 px-3 py-2.5 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-medium">{visit.visitType}</p>
                    <span className="text-muted-foreground font-mono text-[11px]">{visit.id}</span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs">
                    <CalendarDays className="size-3" aria-hidden="true" />
                    <time dateTime={visit.occurredAt}>
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
                    <span>{visit.doctorName}</span>
                  </p>
                </div>
                <BookingStatusBadge tone={statusTone[visit.status]}>
                  {visit.status}
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
