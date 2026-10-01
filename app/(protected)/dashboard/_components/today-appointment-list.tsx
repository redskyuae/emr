import Link from 'next/link';
import { ArrowRight, CalendarClock } from 'lucide-react';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import { appointmentStatusVariant } from '@/app/(protected)/appointments/_utils/appointment-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

function appointmentTime(appointment: Appointment) {
  return appointment.startTime ?? appointment.slots[0]?.slotTime ?? 'Time unavailable';
}

export function TodayAppointmentList({
  appointments,
  slotDate,
  hasAppointments,
  hasMore,
}: {
  appointments: Appointment[];
  slotDate: string;
  hasAppointments: boolean;
  hasMore: boolean;
}) {
  const appointmentsHref = `/appointments?date=${encodeURIComponent(slotDate)}`;

  return (
    <Card size="sm" className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Active schedule</CardTitle>
            <p className="text-muted-foreground text-xs">First six active Appointments by time.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={appointmentsHref}>
              View all <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <Empty className="py-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarClock aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>
                {hasMore
                  ? 'No active Appointments in the loaded bookings'
                  : hasAppointments
                    ? 'No active Appointments'
                    : 'No Appointments scheduled today'}
              </EmptyTitle>
              <EmptyDescription>
                {hasMore
                  ? 'Open the full Appointment list to review the remaining bookings.'
                  : hasAppointments
                    ? 'Review completed, cancelled, and no-show bookings in the full Appointment list.'
                    : 'New bookings for today will appear here.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-border divide-y">
            {appointments.map((appointment) => {
              const isProcedure = appointment.bookingPath === 'PROCEDURE';

              return (
                <li key={appointment.id}>
                  <Link
                    href={`${appointmentsHref}&appointment=${appointment.id}`}
                    className={`hover:bg-muted/50 focus-visible:ring-ring -mx-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border-l-2 px-2 py-2 outline-none focus-visible:ring-2 sm:flex-nowrap ${isProcedure ? 'border-l-procedure' : 'border-l-primary'}`}
                  >
                    <span
                      className={`min-w-16 shrink-0 rounded-md px-2 py-1 font-mono text-xs font-semibold tabular-nums ${isProcedure ? 'bg-procedure/10 text-procedure' : 'bg-primary/10 text-primary'}`}
                    >
                      {appointmentTime(appointment)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        <span className="font-mono">{appointment.bookingNumber}</span> · MRN{' '}
                        <span className="font-mono">{appointment.patient.mrn}</span> ·{' '}
                        <span className={isProcedure ? 'text-procedure' : 'text-primary'}>
                          {isProcedure ? 'Procedure' : 'Consultation'}
                        </span>
                      </span>
                    </span>
                    <span className="min-w-0 text-xs font-medium sm:w-32">
                      {appointment.doctor?.name ??
                        appointment.therapist?.name ??
                        'No clinician assigned'}
                    </span>
                    <Badge
                      variant={appointmentStatusVariant(appointment.appointmentStatus.category)}
                    >
                      {appointment.appointmentStatus.name}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
