'use client';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAppointmentQuery } from '@/app/queries/appointments/useAppointment';
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
          {appointmentQuery.isLoading ? (
            <div className="space-y-3" aria-label="Loading Appointment">
              {[0, 1, 2, 3].map((field) => (
                <div key={field} className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          ) : null}

          {appointmentQuery.isError ? (
            <p className="text-destructive text-sm">{getApiErrorMessage(appointmentQuery.error)}</p>
          ) : null}

          {appointment ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{appointment.appointmentStatus.name}</Badge>
                <Badge variant="outline">{appointment.appointmentType.name}</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Doctor" value={appointment.doctor.name} />
                <DetailField label="Slot date" value={toDisplayDate(appointment.slotDate)} />
                <DetailField
                  label="Slot time"
                  value={appointment.slots.map((slot) => slot.slotTime).join(', ')}
                />
                <DetailField label="Rota" value={appointment.rotaName} />
                <DetailField label="Mode" value={appointment.appointmentMode.name} />
                <DetailField label="Reason" value={appointment.appointmentReason.name} />
              </div>

              <DetailField label="Remarks" value={appointment.remarks} />
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
