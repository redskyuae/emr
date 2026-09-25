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
    if (values.patientMode !== 'existing' || values.patientId === '') {
      throw new Error('A registered Patient is required for a Procedure');
    }

    const procedure = {
      bookingPath: 'PROCEDURE' as const,
      patientId: Number(values.patientId),
      slotDate: toAppointmentSlotDate(values.slotDate),
      remarks: values.remarks || undefined,
      ...(values.doctorId && values.doctorId !== 'not-applicable'
        ? { doctorId: Number(values.doctorId) }
        : {}),
      startTime: values.startTime,
      endTime: values.endTime,
      roomId: Number(values.roomId),
      ...(values.therapistId && values.therapistId !== 'not-required'
        ? { therapistId: Number(values.therapistId) }
        : {}),
    };

    if (values.selectionMode === 'EXISTING_PLAN') {
      return {
        ...procedure,
        patientTreatmentPlanId: Number(values.patientTreatmentPlanId),
        patientTreatmentPlanSessionId: Number(values.patientTreatmentPlanSessionId),
      };
    }

    if (values.selectionMode === 'CATALOGUE') {
      return {
        ...procedure,
        treatmentId: Number(values.treatmentId),
        ...(values.totalSessions === '' ? {} : { totalSessions: Number(values.totalSessions) }),
      };
    }

    throw new Error('Treatment selection is required');
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
