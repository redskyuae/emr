'use client';

import Link from 'next/link';
import { Eye, MoreHorizontal, UserRound } from 'lucide-react';

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
import { appointmentStatusVariant } from '../_utils/appointment-status';

function formatSlotRange(appointment: Appointment) {
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

export function AppointmentsTable({ appointments }: { appointments: Appointment[] }) {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left">
              <th className="p-3 pl-4 font-medium">Booking</th>
              <th className="p-3 font-medium">Date / Slot</th>
              <th className="p-3 font-medium">Patient</th>
              <th className="p-3 font-medium">Doctor</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Mode</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id} className="hover:bg-muted/50 border-b last:border-b-0">
                <td className="p-3 pl-4">
                  <p className="font-mono text-sm font-medium">{appointment.bookingNumber}</p>
                  <p className="text-muted-foreground text-xs">{appointment.rotaName}</p>
                </td>
                <td className="p-3">
                  <p className="font-medium tabular-nums">{appointment.slotDate}</p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {formatSlotRange(appointment)}
                  </p>
                </td>
                <td className="p-3">
                  <Link
                    href={`/patients/${appointment.patient.id}`}
                    className="font-medium hover:underline"
                  >
                    {appointment.patient.firstName} {appointment.patient.lastName}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    {appointment.patient.mrn} / {appointment.patient.phone}
                  </p>
                </td>
                <td className="p-3">{appointment.doctor.name}</td>
                <td className="p-3">
                  <Badge variant="secondary">{appointment.appointmentType.code}</Badge>
                </td>
                <td className="p-3">
                  <Badge variant="outline">{appointment.appointmentMode.code}</Badge>
                </td>
                <td className="p-3">
                  <Badge variant={appointmentStatusVariant(appointment.appointmentStatus.category)}>
                    {appointment.appointmentStatus.name}
                  </Badge>
                </td>
                <td className="p-3 pr-4 text-right">
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
                      <DropdownMenuItem asChild>
                        <Link href={`/patients/${appointment.patient.id}`}>
                          <UserRound className="size-4" />
                          Open Patient
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/visits?checkin=new">
                          <Eye className="size-4" />
                          Check-in desk
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AppointmentsTableSkeleton() {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border p-3">
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="ml-auto h-8 w-10" />
        </div>
      ))}
    </div>
  );
}
