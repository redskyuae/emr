'use client';

import Link from 'next/link';
import { CalendarClock, CircleX, MoreHorizontal, Phone, Plus, UserRound } from 'lucide-react';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  tableCellClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from '@/components/ui/table-styles';
import { cn } from '@/lib/utils';
import { canCancelAppointment } from '../_utils/appointment-cancellation';
import { appointmentStatusVariant } from '../_utils/appointment-status';

function formatSlotRange(appointment: Appointment) {
  if (appointment.startTime && appointment.endTime) {
    return `${appointment.startTime}-${appointment.endTime}`;
  }

  if (appointment.slots.length === 0) {
    return 'No slots';
  }

  const first = appointment.slots[0]?.slotTime;
  const last = appointment.slots.at(-1)?.slotTime;

  if (!first || !last) {
    return 'No slots';
  }

  return first === last ? first : `${first}-${last}`;
}

export function AppointmentsTable({
  appointments,
  total,
  totalPages,
  page,
  pageSize,
  isFetching,
  onPageChange,
  onCancel,
  label = 'Appointments',
}: {
  appointments: Appointment[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  onCancel: (appointment: Appointment) => void;
  label?: string;
}) {
  return (
    <div
      className="bg-card shadow-fluent-2 overflow-hidden rounded-xl border"
      aria-busy={isFetching}
    >
      <div className={cn('overflow-x-auto', isFetching && 'opacity-70 transition-opacity')}>
        <table aria-label={label} className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeadCellClass}>Booking</th>
              <th className={tableHeadCellClass}>Date / Slot</th>
              <th className={tableHeadCellClass}>Patient</th>
              <th className={tableHeadCellClass}>Doctor</th>
              <th className={tableHeadCellClass}>Therapist</th>
              <th className={tableHeadCellClass}>Type</th>
              <th className={tableHeadCellClass}>Mode</th>
              <th className={tableHeadCellClass}>Status</th>
              <th className={cn(tableHeadCellClass, 'text-right')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => {
              const canReschedule =
                appointment.appointmentStatus.category === 'scheduled' ||
                appointment.appointmentStatus.category === 'confirmed';
              const canCancel = canCancelAppointment(appointment.appointmentStatus.category);

              return (
                <tr key={appointment.id} className="hover:bg-muted/50 border-b last:border-b-0">
                  <td className={tableCellClass}>
                    <p className="font-mono text-sm font-medium">{appointment.bookingNumber}</p>
                    <p className="text-muted-foreground text-xs">
                      {appointment.bookingPath === 'PROCEDURE'
                        ? 'Procedure'
                        : (appointment.rotaName ?? 'Consultation')}
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    <p className="font-medium tabular-nums">{appointment.slotDate}</p>
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {formatSlotRange(appointment)}
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    <Link
                      href={`/patients/${appointment.patient.id}`}
                      className="font-medium hover:underline"
                    >
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </Link>
                    <p className="text-muted-foreground text-xs">MRN {appointment.patient.mrn}</p>
                    <a
                      href={`tel:${appointment.patient.phone}`}
                      className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                      aria-label={`Call ${appointment.patient.firstName} ${appointment.patient.lastName} at ${appointment.patient.phone}`}
                    >
                      <Phone className="size-3" aria-hidden="true" />
                      {appointment.patient.phone}
                    </a>
                  </td>
                  <td className={tableCellClass}>{appointment.doctor?.name ?? 'N/A'}</td>
                  <td className={tableCellClass}>{appointment.therapist?.name ?? 'N/A'}</td>
                  <td className={tableCellClass}>
                    <Badge variant="secondary">
                      {appointment.appointmentType?.code ?? appointment.bookingPath}
                    </Badge>
                  </td>
                  <td className={tableCellClass}>
                    <Badge variant="outline">{appointment.appointmentMode?.code ?? 'N/A'}</Badge>
                  </td>
                  <td className={tableCellClass}>
                    <Badge
                      variant={appointmentStatusVariant(appointment.appointmentStatus.category)}
                    >
                      {appointment.appointmentStatus.name}
                    </Badge>
                  </td>
                  <td className={cn(tableCellClass, 'text-right')}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${appointment.bookingNumber}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canReschedule ? (
                          <DropdownMenuItem asChild>
                            <Link href={`/appointments/${appointment.id}/reschedule`}>
                              <CalendarClock className="size-4" />
                              Reschedule
                            </Link>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled>
                            <CalendarClock className="size-4" />
                            Reschedule
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          disabled={!canCancel}
                          className="text-destructive focus:text-destructive"
                          onSelect={() => onCancel(appointment)}
                        >
                          <CircleX className="size-4" />
                          Cancel Appointment
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/patients/${appointment.patient.id}`}>
                            <UserRound className="size-4" />
                            Open Patient
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/visits/new?appointmentId=${appointment.id}`}>
                            <Plus className="size-4" />
                            Create Visit
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col items-center justify-between gap-3 border-t p-3 sm:flex-row">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          Showing {(page - 1) * pageSize + 1}&ndash;{Math.min(page * pageSize, total)} of {total}
          {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
        </p>
        {totalPages > 1 ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isFetching}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AppointmentsTableSkeleton() {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-xl border p-4">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-32" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="ml-auto h-8 w-10" />
        </div>
      ))}
      <div className="flex items-center justify-between border-t p-3">
        <Skeleton className="h-5 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}
