import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';
import type { Room } from '@/app/api/lib/modules/room/schemas/room-schema';
import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';

export function BookingSummary({
  values,
  room,
  therapist,
  doctorName,
  showProcedureResources = true,
}: {
  values: BookAppointmentFormValues;
  room: Room | null;
  therapist: Therapist | null;
  doctorName: string;
  showProcedureResources?: boolean;
}) {
  const procedure = values.visitType === 'PROCEDURE';
  const date = values.slotDate
    ? new Date(values.slotDate + 'T12:00:00').toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Choose a date';
  const time = values.startTime
    ? values.startTime + '–' + values.endTime
    : 'Choose start and end time';
  return (
    <div
      aria-label="Booking summary"
      className="order-first w-full min-w-0 space-y-1 sm:order-none sm:w-auto sm:flex-1"
    >
      <p className="text-sm font-medium">
        {date} <span className="text-muted-foreground mx-1">·</span>{' '}
        <span className="font-mono text-xs">{time}</span>
      </p>
      <p className="text-muted-foreground text-xs">
        {doctorName || 'Choose a Doctor'}
        {procedure && showProcedureResources
          ? ' · ' +
            (room ? `Room ${room.roomNumber}` : 'Choose a Room') +
            ' · ' +
            (therapist?.name ?? 'Choose a Therapist')
          : ''}
      </p>
    </div>
  );
}
