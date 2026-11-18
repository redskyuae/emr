import Link from 'next/link';
import { CiCalendarDate } from 'react-icons/ci';
import { PiArrowRightLight } from 'react-icons/pi';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import { appointmentStatusVariant } from '@/app/(protected)/appointments/_utils/appointment-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

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
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle>Active schedule</CardTitle>
        <CardDescription>First six active Appointments by time.</CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href={appointmentsHref}>
              View all <PiArrowRightLight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <Empty className="py-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CiCalendarDate aria-hidden="true" />
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
                    className="hover:bg-muted/50 focus-visible:ring-ring -mx-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-2 py-3 outline-none focus-visible:ring-2 sm:flex-nowrap"
                  >
                    <span className="min-w-16 shrink-0 font-mono text-sm font-medium tabular-nums">
                      {appointmentTime(appointment)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </span>
                      <span className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-xs">
                        <span className="font-mono">{appointment.bookingNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          MRN <span className="font-mono">{appointment.patient.mrn}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            aria-hidden="true"
                            className={cn(
                              'size-1.5 rounded-full',
                              isProcedure ? 'bg-procedure' : 'bg-primary'
                            )}
                          />
                          {isProcedure ? 'Procedure' : 'Consultation'}
                        </span>
                      </span>
                    </span>
                    {/* On a phone the clinician and status take their own line under the name. */}
                    <span className="flex w-full items-center justify-between gap-3 pl-20 sm:contents">
                      <span className="text-muted-foreground min-w-0 text-xs font-medium sm:w-32">
                        {appointment.doctor?.name ??
                          appointment.therapist?.name ??
                          'No clinician assigned'}
                      </span>
                      <Badge
                        variant={appointmentStatusVariant(appointment.appointmentStatus.category)}
                      >
                        {appointment.appointmentStatus.name}
                      </Badge>
                    </span>
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
