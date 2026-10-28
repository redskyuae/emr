import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';

type VisitDefaults = {
  visitTypeId: string;
  chiefComplaint: string;
  remarks: string;
};

export function getAppointmentVisitDefaults(
  appointment: Appointment | undefined,
  visitTypes: VisitType[],
  hasRecentDoctorVisit = false
): VisitDefaults {
  if (!appointment) {
    return { visitTypeId: '', chiefComplaint: '', remarks: '' };
  }

  const typeCode = appointment.appointmentType?.code.trim().toUpperCase();
  const reasonCode = appointment.appointmentReason?.code.trim().toUpperCase();
  const visitCode =
    appointment.bookingPath === 'PROCEDURE'
      ? 'PROC'
      : typeCode === 'EMR' || typeCode === 'EMER' || reasonCode === 'EMR'
        ? 'EMER'
        : typeCode === 'PROC'
          ? 'PROC'
          : typeCode === 'VAC'
            ? 'VAC'
            : typeCode === 'FUP' ||
                reasonCode === 'FLW' ||
                reasonCode === 'FUP' ||
                reasonCode === 'RSLT' ||
                hasRecentDoctorVisit
              ? 'FUP'
              : 'OPD';
  const visitType = visitTypes.find((type) => type.code.trim().toUpperCase() === visitCode);
  const purpose =
    appointment.bookingPath === 'PROCEDURE'
      ? [appointment.treatment?.name, appointment.treatmentSession?.label]
          .filter(Boolean)
          .join(' · ')
      : (appointment.appointmentReason?.name ?? '');

  return {
    visitTypeId: visitType ? String(visitType.id) : '',
    chiefComplaint: purpose,
    remarks: appointment.remarks ?? '',
  };
}

export function getWalkInVisitTypeId(visitTypes: VisitType[], hasRecentDoctorVisit: boolean) {
  const code = hasRecentDoctorVisit ? 'FUP' : 'OPD';
  const visitType = visitTypes.find((type) => type.code.trim().toUpperCase() === code);
  return visitType ? String(visitType.id) : '';
}
