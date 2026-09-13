import type {
  CreateAppointmentRequest,
  CreateAppointmentResponse,
} from '@/app/api/v1/appointments/types';

import type { BookAppointmentFormValues } from './book-appointment-form-schema';
import { bookAppointmentFormValuesToRequest } from './book-appointment-request';
import type { BookingPath } from './book-appointment-types';

export type BookingConfirmation = {
  bookingNumber: string;
  path: BookingPath;
  patientName: string;
  detail: string;
};

type CreateAppointment = (request: CreateAppointmentRequest) => Promise<CreateAppointmentResponse>;

export async function submitBookAppointment(
  values: BookAppointmentFormValues,
  createAppointment: CreateAppointment
): Promise<BookingConfirmation> {
  if (values.visitType === '') {
    throw new Error('Booking Path is required');
  }

  const response = await createAppointment(bookAppointmentFormValuesToRequest(values));
  const appointment = response.data;
  const firstSlot = appointment.startTime ?? appointment.slots[0]?.slotTime ?? values.startTime;
  const endTime = appointment.endTime ?? values.endTime;

  return {
    bookingNumber: appointment.bookingNumber,
    path: values.visitType,
    patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    detail: `${appointment.doctor?.name ?? 'N/A'} · ${appointment.slotDate} · ${firstSlot}–${endTime}`,
  };
}
