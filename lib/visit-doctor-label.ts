// Only OPD Consultation Visits must have a Doctor (ADR 0049); the rest may have none.
export function visitDoctorLabel(visit: { doctor: { name: string } | null }) {
  return visit.doctor?.name ?? 'No Doctor';
}
