import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';

type VisitDefaults = {
  visitTypeId: string;
  chiefComplaint: string;
  remarks: string;
};

export function getAppointmentVisitDefaults(
  appointment: Appointment | undefined,
  visitTypes: VisitType[]
): VisitDefaults {
  if (appointment?.bookingPath !== 'PROCEDURE') {
    return { visitTypeId: '', chiefComplaint: '', remarks: '' };
  }

  const procedureVisitType = visitTypes.find((type) => type.code.toUpperCase() === 'PROC');
  const purpose = [appointment.treatment?.name, appointment.treatmentSession?.label]
    .filter(Boolean)
    .join(' · ');

  return {
    visitTypeId: procedureVisitType ? String(procedureVisitType.id) : '',
    chiefComplaint: purpose,
    remarks: appointment.remarks ?? '',
  };
}
