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

type ProcedureSession = {
  key: string;
  sessionNumber: number;
  label: string | null;
  procedure: string | null;
  durationMinutes: number | null;
  setupMinutes: number | null;
  cleaningMinutes: number | null;
  preparation: string | null;
  equipment: string | null;
  warning: string | null;
  conductionNote: string | null;
  completed: boolean | null;
};

export type VisitProcedure = {
  key: string;
  treatmentName: string;
  /** Plan progress, shown when the Plan was prescribed in this (imported) Visit. */
  progress: string | null;
  sessions: ProcedureSession[];
};

type ProcedureVisit = Pick<Visit, 'id' | 'legacyVisitNumber' | 'treatment' | 'treatmentSession'>;

function procedureSession(
  session: PatientTreatmentPlanReadSession,
  showStatus: boolean
): ProcedureSession {
  return {
    key: `plan-session-${session.id}`,
    label: session.label,
    warning: session.warning,
    procedure: session.procedure,
    equipment: session.equipment,
    preparation: session.preparation,
    setupMinutes: session.setupMinutes,
    sessionNumber: session.sessionNumber,
    conductionNote: session.legacyConductionNote,
    durationMinutes: session.durationMinutes,
    cleaningMinutes: session.cleaningMinutes,
    completed: showStatus ? session.completionStatus === 'COMPLETED' : null,
  };
}

/**
 * The procedures behind a Visit, with their treatment details and conduction notes:
 * a Plan imported from the source system shows every Session under the source Visit it
 * was prescribed in; otherwise the Plan Sessions this Visit started or completed; and
 * failing both, the Treatment Session recorded on the Visit itself.
 */
export function visitProcedures(visit: ProcedureVisit, plans: PatientTreatmentPlan[]) {
  const procedures: VisitProcedure[] = plans.flatMap((plan) => {
    const sessions = [...plan.sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
    const prescribedHere =
      visit.legacyVisitNumber !== null && plan.legacyVisitNumber === visit.legacyVisitNumber;
    const delivered = prescribedHere
      ? sessions
      : sessions.filter(
          (session) => session.completedVisitId === visit.id || session.startedVisitId === visit.id
        );

    if (delivered.length === 0) return [];

    return [
      {
        key: `plan-${plan.id}`,
        treatmentName: plan.treatmentName,
        progress: prescribedHere
          ? `${plan.completedSessions} of ${plan.totalSessions} Sessions completed`
          : null,
        sessions: delivered.map((session) => procedureSession(session, prescribedHere)),
      },
    ];
  });

  if (procedures.length || !visit.treatmentSession) return procedures;

  const session = visit.treatmentSession;

  return [
    {
      progress: null,
      key: `treatment-session-${session.id}`,
      treatmentName: visit.treatment?.name ?? 'Treatment',
      sessions: [
        {
          warning: null,
          equipment: null,
          completed: null,
          label: session.label,
          preparation: null,
          conductionNote: null,
          key: `treatment-session-${session.id}`,
          procedure: session.procedure,
          setupMinutes: session.setupMinutes,
          sessionNumber: session.sessionNumber,
          durationMinutes: session.durationMinutes,
          cleaningMinutes: session.cleaningMinutes,
        },
      ],
    },
  ];
}
