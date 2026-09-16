import type { RescheduleAppointmentRequest } from '@/app/api/v1/appointments/[id]/reschedule/types';
import type { BookAppointmentFormValues } from '@/app/(protected)/appointments/new/_utils/book-appointment-form-schema';
import { toAppointmentSlotDate } from '@/app/(protected)/appointments/new/_utils/book-appointment-request';

export function rescheduleAppointmentFormValuesToRequest(
  values: BookAppointmentFormValues
): RescheduleAppointmentRequest {
  if (values.visitType === 'PROCEDURE') {
    return {
      bookingPath: 'PROCEDURE',
      slotDate: toAppointmentSlotDate(values.slotDate),
      startTime: values.startTime,
      endTime: values.endTime,
    };
  }

  if (values.visitType === 'CONSULTATION') {
    return {
      bookingPath: 'CONSULTATION',
      doctorId: Number(values.doctorId),
      slotDate: toAppointmentSlotDate(values.slotDate),
      doctorRotaId: Number(values.doctorRotaId),
      slotTimes: values.slotTimes,
    };
  }

  throw new Error('Booking Path is required');
}
