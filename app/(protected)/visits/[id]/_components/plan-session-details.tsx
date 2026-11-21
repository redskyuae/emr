import type { PatientTreatmentPlanReadSession } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';

const minutes = (value: number | null) => (value === null ? null : `${value} min`);

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-sm whitespace-pre-wrap">
        {value || <span className="text-muted-foreground">Not set</span>}
      </dd>
    </div>
  );
}

export function PlanSessionDetails({ session }: { session: PatientTreatmentPlanReadSession }) {
  return (
    <dl className="space-y-4">
      <DetailRow label="Procedure" value={session.procedure} />
      <div className="grid gap-4 sm:grid-cols-3">
        <DetailRow label="Duration" value={minutes(session.durationMinutes)} />
        <DetailRow label="Setup" value={minutes(session.setupMinutes)} />
        <DetailRow label="Cleaning" value={minutes(session.cleaningMinutes)} />
      </div>
      <DetailRow label="Preparation" value={session.preparation} />
      <DetailRow label="Equipment" value={session.equipment} />
      <div className="grid gap-4 sm:grid-cols-2">
        <DetailRow label="Room type" value={session.roomType} />
        <DetailRow label="Therapist Skill" value={session.therapistSkill} />
      </div>
    </dl>
  );
}
