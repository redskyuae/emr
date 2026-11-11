import type {
  PatientTreatmentPlan,
  PatientTreatmentPlanReadSession,
} from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

type PlanVisit = Pick<Visit, 'id' | 'appointment'>;
type StartVisit = Pick<Visit, 'id' | 'appointment' | 'status'>;

export function isCurrentPlan(plan: Pick<PatientTreatmentPlan, 'status'>) {
  return plan.status === 'PENDING' || plan.status === 'IN_PROGRESS';
}

export function planSessionLabel(session: PatientTreatmentPlanReadSession, visit: PlanVisit) {
  if (session.completionStatus === 'COMPLETED') return 'Done';
  if (session.startedVisitId !== null) return 'In progress';

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
    sessions.find((session) => session.startedVisitId === visit.id) ??
    sessions.find((session) => planSessionLabel(session, visit) === 'Today') ??
    sessions.find((session) => session.completionStatus === 'PENDING')
  );
}

/**
 * Mirrors the start rules the API enforces: an active Visit delivers one Session per Plan,
 * and a booked Session can only be started in its own Appointment's Visit.
 */
export function canStartPlanSession(
  plan: PatientTreatmentPlan,
  session: PatientTreatmentPlanReadSession,
  visit: StartVisit
) {
  if (visit.status !== 'CHECKED_IN' && visit.status !== 'IN_CONSULTATION') return false;
  if (!isCurrentPlan(plan)) return false;
  if (session.completionStatus === 'COMPLETED' || session.startedVisitId !== null) return false;

  const bookingNumber = visit.appointment?.bookingNumber ?? null;
  const reservedFor = session.reservedAppointment?.bookingNumber ?? null;
  if (reservedFor !== null && reservedFor !== bookingNumber) return false;

  return !plan.sessions.some(
    (other) =>
      other.id !== session.id &&
      (other.startedVisitId === visit.id ||
        other.completedVisitId === visit.id ||
        (other.completionStatus === 'PENDING' &&
          bookingNumber !== null &&
          other.reservedAppointment?.bookingNumber === bookingNumber))
  );
}
