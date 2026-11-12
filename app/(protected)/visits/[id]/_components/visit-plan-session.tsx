import { NotebookPen } from 'lucide-react';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { Button } from '@/components/ui/button';

function minutes(value: number | null) {
  return value ? `${value} min` : null;
}

/** The Treatment Session this Visit delivers, beside the Plan of the note. */
export function VisitPlanSession({
  visit,
  canRecordResponse,
  onDailyTreatment,
}: {
  visit: Visit;
  canRecordResponse: boolean;
  onDailyTreatment: () => void;
}) {
  const session = visit.treatmentSession;

  if (!session) return null;

  const timing = [
    minutes(session.durationMinutes),
    session.setupMinutes ? `${session.setupMinutes} setup` : null,
    session.cleaningMinutes ? `${session.cleaningMinutes} cleaning` : null,
  ].filter(Boolean);
  const details = [
    { label: 'Room type', value: session.roomType },
    { label: 'Therapist skill', value: session.therapistSkill },
  ].filter((item) => item.value);

  return (
    <section
      aria-labelledby="plan-session"
      className="border-l-procedure flex flex-col gap-3 rounded-lg border border-l-4 p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="plan-session" className="text-base font-semibold">
          Session {session.sessionNumber}
        </h3>
        {timing.length ? (
          <span className="text-muted-foreground text-sm">{timing.join(' + ')}</span>
        ) : null}
      </div>
      <p className="text-sm">
        <span className="font-medium">{session.label}</span>
        {session.procedure ? (
          <span className="text-muted-foreground"> · {session.procedure}</span>
        ) : null}
      </p>
      {details.length ? (
        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          {details.map((item) => (
            <div key={item.label}>
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {canRecordResponse ? (
        <div>
          <Button type="button" variant="outline" onClick={onDailyTreatment}>
            <NotebookPen className="size-4" />
            Record treatment response
          </Button>
        </div>
      ) : null}
    </section>
  );
}
