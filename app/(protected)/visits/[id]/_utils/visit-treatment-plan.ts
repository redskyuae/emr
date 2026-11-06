import type {
  PatientTreatmentPlan,
  PatientTreatmentPlanReadSession,
} from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

type PlanVisit = Pick<Visit, 'id' | 'appointment'>;

export function isCurrentPlan(plan: Pick<PatientTreatmentPlan, 'status'>) {
  return plan.status === 'PENDING' || plan.status === 'IN_PROGRESS';
}

export function planSessionLabel(session: PatientTreatmentPlanReadSession, visit: PlanVisit) {
  if (session.completionStatus === 'COMPLETED') return 'Done';

  const bookingNumber = session.reservedAppointment?.bookingNumber;

  // A walk-in Visit has no Appointment, so an unreserved Session must not match it.
  if (bookingNumber && bookingNumber === visit.appointment?.bookingNumber) return 'Today';
  if (session.isReserved) return 'Booked';
  return 'Pending';
}

/** The Session this Visit delivers, otherwise the next one still to be done. */
export function currentPlanSession(plan: PatientTreatmentPlan, visit: PlanVisit) {
  const sessions = [...plan.sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);

  return (
    sessions.find((session) => session.completedVisitId === visit.id) ??
    sessions.find((session) => planSessionLabel(session, visit) === 'Today') ??
    sessions.find((session) => session.completionStatus === 'PENDING')
  );
}
