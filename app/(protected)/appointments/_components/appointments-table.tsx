'use client';

import Link from 'next/link';
import { CiCalendarDate, CiCircleRemove, CiPhone, CiUser } from 'react-icons/ci';
import { PiDotsThreeLight, PiPlusLight } from 'react-icons/pi';

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
  canReschedule,
  label = 'Appointments',
}: {
  appointments: Appointment[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  /** Omitted without `appointment:cancel`, which hides Cancel Appointment. */
  onCancel?: (appointment: Appointment) => void;
  /** The user holds `appointment:reschedule`; without it Reschedule is hidden. */
  canReschedule: boolean;
  label?: string;
}) {
  return (
    <div className="bg-card overflow-hidden rounded-xl border" aria-busy={isFetching}>
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
              const reschedulable =
                appointment.appointmentStatus.category === 'scheduled' ||
                appointment.appointmentStatus.category === 'confirmed';
              const cancellable = canCancelAppointment(appointment.appointmentStatus.category);

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
                      <CiPhone className="size-3" aria-hidden="true" />
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
                          <PiDotsThreeLight className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!canReschedule ? null : reschedulable ? (
                          <DropdownMenuItem asChild>
                            <Link href={`/appointments/${appointment.id}/reschedule`}>
                              <CiCalendarDate className="size-4" />
                              Reschedule
                            </Link>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled>
                            <CiCalendarDate className="size-4" />
                            Reschedule
                          </DropdownMenuItem>
                        )}
                        {onCancel ? (
                          <DropdownMenuItem
                            disabled={!cancellable}
                            className="text-destructive focus:text-destructive"
                            onSelect={() => onCancel(appointment)}
                          >
                            <CiCircleRemove className="size-4" />
                            Cancel Appointment
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem asChild>
                          <Link href={`/patients/${appointment.patient.id}`}>
                            <CiUser className="size-4" />
                            Open Patient
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/visits/new?appointmentId=${appointment.id}`}>
                            <PiPlusLight className="size-4" />
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

// Mirrors the loaded table: the same header, one sized skeleton per cell for a full page
// (five rows), and the "Showing … of …" footer with its pager.
export function AppointmentsTableSkeleton() {
  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-sm">
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
            {Array.from({ length: 5 }, (_, row) => (
              <tr key={row} className="border-b last:border-b-0">
                <td className={tableCellClass}>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </td>
                <td className={tableCellClass}>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </td>
                <td className={tableCellClass}>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                    <div className="flex items-center gap-1">
                      <Skeleton className="size-3 rounded-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </td>
                <td className={tableCellClass}>
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className={tableCellClass}>
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className={tableCellClass}>
                  <Skeleton className="h-6 w-14 rounded-full" />
                </td>
                <td className={tableCellClass}>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </td>
                <td className={tableCellClass}>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className={tableCellClass}>
                  <Skeleton className="ml-auto size-9" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col items-center justify-between gap-3 border-t p-3 sm:flex-row">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}
