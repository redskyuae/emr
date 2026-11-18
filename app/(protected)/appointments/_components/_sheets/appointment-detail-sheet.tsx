'use client';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAppointmentQuery } from '@/app/queries/appointments/useAppointment';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toDisplayDate } from '../../_utils/appointment-date';
import { DetailField } from '../detail-field';

function DetailFieldSkeleton() {
  return (
    <div className="space-y-1">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-32" />
    </div>
  );
}

// Mirrors the loaded body: the status and type badges, the two-column field grid, and Remarks.
function AppointmentDetailSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading Appointment">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, field) => (
          <DetailFieldSkeleton key={field} />
        ))}
      </div>
      <DetailFieldSkeleton />
    </div>
  );
}

export function AppointmentDetailSheet({
  appointmentId,
  onClose,
}: {
  appointmentId: number | null;
  onClose: () => void;
}) {
  const appointmentQuery = useAppointmentQuery(appointmentId);
  const appointment = appointmentQuery.data;

  return (
    <Sheet open={appointmentId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{appointment?.bookingNumber ?? 'Booking'}</SheetTitle>
          <SheetDescription>
            {appointment
              ? `${appointment.patient.firstName} ${appointment.patient.lastName} · MRN ${appointment.patient.mrn}`
              : 'Appointment details'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto px-4 pb-6">
          {appointmentQuery.isError ? (
            <p className="text-destructive text-sm">{getApiErrorMessage(appointmentQuery.error)}</p>
          ) : null}

          <SkeletonCrossfade
            isLoading={appointmentQuery.isLoading}
            skeleton={<AppointmentDetailSkeleton />}
          >
            {appointment ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{appointment.appointmentStatus.name}</Badge>
                  <Badge variant="outline">
                    {appointment.appointmentType?.name ?? appointment.bookingPath}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="Doctor" value={appointment.doctor?.name ?? 'N/A'} />
                  <DetailField label="Slot date" value={toDisplayDate(appointment.slotDate)} />
                  <DetailField
                    label="Time"
                    value={
                      appointment.startTime && appointment.endTime
                        ? `${appointment.startTime}–${appointment.endTime}`
                        : appointment.slots.map((slot) => slot.slotTime).join(', ')
                    }
                  />
                  <DetailField label="Rota" value={appointment.rotaName ?? 'N/A'} />
                  <DetailField label="Mode" value={appointment.appointmentMode?.name ?? 'N/A'} />
                  <DetailField
                    label="Reason"
                    value={appointment.appointmentReason?.name ?? 'N/A'}
                  />
                  {appointment.appointmentCancelledReason ? (
                    <DetailField
                      label="Cancellation reason"
                      value={appointment.appointmentCancelledReason.name}
                    />
                  ) : null}
                  {appointment.rescheduleReason ? (
                    <DetailField label="Rescheduling reason" value={appointment.rescheduleReason} />
                  ) : null}
                  {appointment.cancelledAt ? (
                    <DetailField
                      label="Cancelled at"
                      value={new Date(appointment.cancelledAt).toLocaleString()}
                    />
                  ) : null}
                </div>

                <DetailField label="Remarks" value={appointment.remarks} />
              </div>
            ) : null}
          </SkeletonCrossfade>
        </div>
      </SheetContent>
    </Sheet>
  );
}
