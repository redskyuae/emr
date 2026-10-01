import { CircleCheck, HeartPulse, Stethoscope } from 'lucide-react';

import type { summarizeAppointmentDay } from '@/app/queries/appointments/useAppointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AppointmentDaySummary = ReturnType<typeof summarizeAppointmentDay>;

export function AppointmentInsights({ summary }: { summary: AppointmentDaySummary }) {
  const loadedTotal = summary.bookingPaths.consultation + summary.bookingPaths.procedure;
  const consultationPercent = loadedTotal
    ? (summary.bookingPaths.consultation / loadedTotal) * 100
    : 0;
  const procedurePercent = loadedTotal ? (summary.bookingPaths.procedure / loadedTotal) * 100 : 0;
  const countPrefix = summary.hasMore ? '≥' : '';

  return (
    <Card size="sm" className="shadow-fluent-2">
      <CardHeader className="border-b">
        <CardTitle>Appointment mix</CardTitle>
        <p className="text-muted-foreground text-xs">Consultation and Procedure bookings today.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted flex h-2 overflow-hidden rounded-full" aria-hidden="true">
          <span className="bg-primary h-full" style={{ width: `${consultationPercent}%` }} />
          <span className="bg-procedure h-full" style={{ width: `${procedurePercent}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="border-primary/20 bg-primary/5 rounded-md border p-2">
            <Stethoscope className="text-primary size-4" aria-hidden="true" />
            <p className="text-muted-foreground mt-1 text-xs">Consultation</p>
            <p className="font-heading text-primary text-lg font-semibold tabular-nums">
              {countPrefix}
              {summary.bookingPaths.consultation}
            </p>
          </div>
          <div className="border-procedure/20 bg-procedure/5 rounded-md border p-2">
            <HeartPulse className="text-procedure size-4" aria-hidden="true" />
            <p className="text-muted-foreground mt-1 text-xs">Procedure</p>
            <p className="font-heading text-procedure text-lg font-semibold tabular-nums">
              {countPrefix}
              {summary.bookingPaths.procedure}
            </p>
          </div>
        </div>

        <div className="border-t pt-3">
          <h3 className="font-heading text-sm font-semibold">Exceptions today</h3>
          {summary.counts.cancelled === 0 && summary.counts.noShow === 0 ? (
            <p className="text-success mt-2 flex items-center gap-2 text-xs">
              <CircleCheck className="size-4" aria-hidden="true" />
              No cancellations or no-shows in loaded bookings.
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="bg-destructive/5 rounded-md p-2">
                <p className="text-muted-foreground text-xs">Cancelled</p>
                <p className="text-destructive font-heading text-lg font-semibold tabular-nums">
                  {countPrefix}
                  {summary.counts.cancelled}
                </p>
              </div>
              <div className="bg-warning/5 rounded-md p-2">
                <p className="text-muted-foreground text-xs">No Show</p>
                <p className="text-warning font-heading text-lg font-semibold tabular-nums">
                  {countPrefix}
                  {summary.counts.noShow}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
