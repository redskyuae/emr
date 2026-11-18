import type { ReactNode } from 'react';
import { CiCircleCheck, CiStethoscope } from 'react-icons/ci';
import { PiHeartbeatLight } from 'react-icons/pi';

import type { summarizeAppointmentDay } from '@/app/queries/appointments/useAppointments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type AppointmentDaySummary = ReturnType<typeof summarizeAppointmentDay>;

export function AppointmentInsights({ summary }: { summary: AppointmentDaySummary }) {
  const loadedTotal = summary.bookingPaths.consultation + summary.bookingPaths.procedure;
  const consultationPercent = loadedTotal
    ? (summary.bookingPaths.consultation / loadedTotal) * 100
    : 0;
  const procedurePercent = loadedTotal ? (summary.bookingPaths.procedure / loadedTotal) * 100 : 0;
  const countPrefix = summary.hasMore ? '≥' : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment mix</CardTitle>
        <CardDescription>Consultation and Procedure bookings today.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted flex h-1.5 overflow-hidden rounded-full" aria-hidden="true">
          <span className="bg-primary h-full" style={{ width: `${consultationPercent}%` }} />
          <span className="bg-procedure h-full" style={{ width: `${procedurePercent}%` }} />
        </div>

        <dl className="grid grid-cols-2 gap-4">
          <Figure
            label="Consultation"
            value={`${countPrefix}${summary.bookingPaths.consultation}`}
            marker={<CiStethoscope className="text-primary size-4" aria-hidden="true" />}
          />
          <Figure
            label="Procedure"
            value={`${countPrefix}${summary.bookingPaths.procedure}`}
            marker={<PiHeartbeatLight className="text-procedure size-4" aria-hidden="true" />}
          />
        </dl>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold">Exceptions today</h3>
          {summary.counts.cancelled === 0 && summary.counts.noShow === 0 ? (
            <p className="text-success mt-2 flex items-center gap-2 text-xs">
              <CiCircleCheck className="size-4" aria-hidden="true" />
              No cancellations or no-shows in loaded bookings.
            </p>
          ) : (
            <dl className="mt-3 grid grid-cols-2 gap-4">
              <Figure
                label="Cancelled"
                value={`${countPrefix}${summary.counts.cancelled}`}
                marker={<span className="bg-destructive size-2 rounded-full" aria-hidden="true" />}
              />
              <Figure
                label="No Show"
                value={`${countPrefix}${summary.counts.noShow}`}
                marker={<span className="bg-warning size-2 rounded-full" aria-hidden="true" />}
              />
            </dl>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** A quiet label over one figure. Only the marker beside the label carries colour. */
function Figure({ label, value, marker }: { label: string; value: string; marker: ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        {marker}
        {label}
      </dt>
      <dd className="font-heading mt-1.5 text-2xl leading-none font-semibold tracking-tight tabular-nums">
        {value}
      </dd>
    </div>
  );
}
