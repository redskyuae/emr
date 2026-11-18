import { Badge } from '@/components/ui/badge';

import type { VisitProcedure } from '../_utils/visit-treatment-plan';

function ProcedureDetail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div>
      <dt className="text-muted-foreground text-xs font-semibold">{label}</dt>
      <dd className="[overflow-wrap:anywhere] whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function ProcedureSession({
  session,
  treatmentName,
}: {
  session: VisitProcedure['sessions'][number];
  treatmentName: string;
}) {
  const timing = [
    session.durationMinutes ? `${session.durationMinutes} min` : null,
    session.setupMinutes ? `${session.setupMinutes} setup` : null,
    session.cleaningMinutes ? `${session.cleaningMinutes} cleaning` : null,
  ].filter(Boolean);
  const title = `Session ${session.sessionNumber}`;
  // Imported Sessions often repeat the Treatment name as their label and procedure.
  const shown = new Set([title, treatmentName].map((value) => value.trim().toLowerCase()));
  const isNew = (value: string | null) => {
    if (!value || shown.has(value.trim().toLowerCase())) return null;
    shown.add(value.trim().toLowerCase());
    return value;
  };
  const label = isNew(session.label);
  const procedure = isNew(session.procedure);

  return (
    <li className="space-y-1.5 border-t pt-2 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <p className="font-medium">{title}</p>
        {session.completed === null ? null : (
          <Badge variant={session.completed ? 'secondary' : 'outline'}>
            {session.completed ? 'Completed' : 'Pending'}
          </Badge>
        )}
      </div>
      {label ? <p className="text-muted-foreground [overflow-wrap:anywhere]">{label}</p> : null}
      {timing.length ? <p className="text-muted-foreground text-xs">{timing.join(' + ')}</p> : null}
      <dl className="space-y-1.5">
        <ProcedureDetail label="Treatment details" value={procedure} />
        <ProcedureDetail label="Preparation" value={session.preparation} />
        <ProcedureDetail label="Equipment" value={session.equipment} />
        <ProcedureDetail label="Warning" value={session.warning} />
        <ProcedureDetail label="Conduction notes" value={session.conductionNote} />
      </dl>
    </li>
  );
}

/** A Treatment delivered in a Visit, with the Sessions that Visit started or completed. */
export function VisitProcedureCard({ procedure }: { procedure: VisitProcedure }) {
  return (
    <section
      aria-label={`Procedure: ${procedure.treatmentName}`}
      className="border-l-procedure space-y-2 rounded-md border border-l-4 p-2"
    >
      <div>
        <p className="text-procedure text-xs font-semibold tracking-wide uppercase">Procedure</p>
        <p className="font-medium [overflow-wrap:anywhere]">{procedure.treatmentName}</p>
        {procedure.progress ? (
          <p className="text-muted-foreground text-xs">{procedure.progress}</p>
        ) : null}
      </div>
      <ul className="space-y-2">
        {procedure.sessions.map((session) => (
          <ProcedureSession
            key={session.key}
            session={session}
            treatmentName={procedure.treatmentName}
          />
        ))}
      </ul>
    </section>
  );
}
