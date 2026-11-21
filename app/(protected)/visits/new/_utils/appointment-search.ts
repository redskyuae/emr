import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';

type SearchableAppointment = Pick<
  Appointment,
  'bookingNumber' | 'patient' | 'doctor' | 'therapist'
>;

function searchText(appointment: SearchableAppointment) {
  const { patient } = appointment;

  return [
    appointment.bookingNumber,
    `${patient.firstName} ${patient.lastName}`,
    patient.mrn,
    patient.phone,
    appointment.doctor?.name,
    appointment.therapist?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/**
 * Every word of the query must appear in the booking number, Patient name,
 * MRN, phone, Doctor or Therapist, so "asha 1042" narrows to one Patient.
 */
export function searchAppointments<T extends SearchableAppointment>(
  appointments: T[],
  query: string
): T[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return appointments;

  return appointments.filter((appointment) => {
    const text = searchText(appointment);
    return terms.every((term) => text.includes(term));
  });
}
