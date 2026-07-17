import type { CreateAppointmentRequest } from '@/app/api/v1/appointments/types';

import type { BookAppointmentFormValues } from './book-appointment-form-schema';

export function toAppointmentSlotDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}

export function bookAppointmentFormValuesToRequest(
  values: BookAppointmentFormValues
): CreateAppointmentRequest {
  const baseRequest = {
    doctorId: Number(values.doctorId),
    appointmentModeId: Number(values.appointmentModeId),
    appointmentTypeId: Number(values.appointmentTypeId),
    appointmentReasonId: Number(values.appointmentReasonId),
    slotDate: toAppointmentSlotDate(values.slotDate),
    doctorRotaId: Number(values.doctorRotaId),
    slotTimes: values.slotTimes,
    remarks: values.remarks || undefined,
  };

  if (values.patientMode === 'existing') {
    return {
      ...baseRequest,
      patientId: Number(values.patientId),
    };
  }

  return {
    ...baseRequest,
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
}
