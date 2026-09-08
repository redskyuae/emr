import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';
import type { DemoRoom, DemoTherapist } from './book-appointment-demo-data';

export function BookingSummary({
  values,
  room,
  therapist,
  doctorName,
}: {
  values: BookAppointmentFormValues;
  room: DemoRoom | null;
  therapist: DemoTherapist | null;
  doctorName: string;
}) {
  const procedure = values.visitType === 'PROCEDURE';
  const date = values.slotDate
    ? new Date(values.slotDate + 'T12:00:00').toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Choose a date';
  const time = procedure
    ? values.startTime
      ? values.startTime + '–' + values.endTime
      : 'Choose a time'
    : values.slotTimes.join(', ') || 'Choose DoctorSlots';
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
        {procedure
          ? (room?.name ?? 'Choose a Room') + ' · ' + (therapist?.name ?? 'Choose a Therapist')
          : doctorName || 'Choose a Doctor'}
      </p>
    </div>
  );
}
