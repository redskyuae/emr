import type { CreateAppointmentRequest } from '@/app/api/v1/appointments/types';

import type { BookAppointmentFormValues } from './book-appointment-form-schema';

export function toAppointmentSlotDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}

export function bookAppointmentFormValuesToRequest(
  values: BookAppointmentFormValues
): CreateAppointmentRequest {
  if (values.visitType === '') {
    throw new Error('Booking Path is required');
  }

  const patient =
    values.patientMode === 'existing'
      ? { patientId: Number(values.patientId) }
      : {
          provisionalPatient: {
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone,
            middleName: values.middleName || undefined,
            gender: values.gender || undefined,
            dateOfBirth: values.dateOfBirth || undefined,
            email: values.email || undefined,
          },
        };
  const common = {
    ...patient,
    slotDate: toAppointmentSlotDate(values.slotDate),
    remarks: values.remarks || undefined,
  };

  if (values.visitType === 'PROCEDURE') {
    return {
      ...common,
      bookingPath: 'PROCEDURE',
      ...(values.doctorId && values.doctorId !== 'not-applicable'
        ? { doctorId: Number(values.doctorId) }
        : {}),
      startTime: values.startTime,
      endTime: values.endTime,
    };
  }

  return {
    ...common,
    bookingPath: 'CONSULTATION',
    doctorId: Number(values.doctorId),
    appointmentModeId: Number(values.appointmentModeId),
    appointmentTypeId: Number(values.appointmentTypeId),
    appointmentReasonId: Number(values.appointmentReasonId),
    doctorRotaId: Number(values.doctorRotaId),
    slotTimes: values.slotTimes,
  };
}
