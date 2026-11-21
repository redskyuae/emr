import type {
  PatientTreatmentPlan,
  PatientTreatmentPlanStatus,
} from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';

const STATUS_LABELS: Record<PatientTreatmentPlanStatus, string> = {
  PENDING: 'Pending',
  STOPPED: 'Stopped',
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In progress',
};

type NextPlanSession = {
  label: string | null;
  state: 'In progress' | 'Booked' | 'Not booked';
  sessionNumber: number;
  bookingNumber: string | null;
};

export function isCurrentTreatmentPlan(plan: Pick<PatientTreatmentPlan, 'status'>) {
  return plan.status === 'PENDING' || plan.status === 'IN_PROGRESS';
}

export function treatmentPlanStatusLabel(status: PatientTreatmentPlanStatus) {
  return STATUS_LABELS[status];
}

/** Current Plans first, then treatment history; newest Plan first within each group. */
export function orderTreatmentPlans(plans: PatientTreatmentPlan[]) {
  return [...plans].sort(
    (a, b) => Number(isCurrentTreatmentPlan(b)) - Number(isCurrentTreatmentPlan(a)) || b.id - a.id
  );
}

/** The next Session a current Plan still has to deliver, and how it stands today. */
export function nextPlanSession(plan: PatientTreatmentPlan): NextPlanSession | null {
  if (!isCurrentTreatmentPlan(plan)) return null;

  const session = [...plan.sessions]
    .sort((a, b) => a.sessionNumber - b.sessionNumber)
    .find((item) => item.completionStatus === 'PENDING');

  if (!session) return null;

  const bookingNumber = session.reservedAppointment?.bookingNumber ?? null;

  return {
    label: session.label,
    sessionNumber: session.sessionNumber,
    bookingNumber,
    state:
      session.startedVisitId !== null ? 'In progress' : bookingNumber ? 'Booked' : 'Not booked',
  };
}
