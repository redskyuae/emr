import Link from 'next/link';
import { CiPlay1 } from 'react-icons/ci';
import {
  PiCalendarPlusLight,
  PiCheckLight,
  PiClipboardTextLight,
  PiClipboardTextDuotone,
  PiPlusLight,
  PiXLight,
} from 'react-icons/pi';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

import {
  canStartPlanSession,
  currentPlanSession,
  isCurrentPlan,
  planSessionLabel,
  visitProcedures,
} from '../_utils/visit-treatment-plan';
import { VisitProcedureCard } from './visit-procedure-card';

type Props = {
  visit: Visit;
  plans: PatientTreatmentPlan[];
  loading: boolean;
  error: boolean;
  canAssignPlan: boolean;
  canBookAppointment: boolean;
  canStartSession: boolean;
  onAssignPlan: () => void;
  onAddSessions: (planId: number) => void;
  onOpenSession: (sessionId: number) => void;
};

const SEGMENT_TONE: Record<ReturnType<typeof planSessionLabel>, string> = {
  Done: 'bg-primary',
  'In progress': 'bg-chart-3',
  Today: 'bg-chart-4',
  Booked: 'bg-chart-2',
  Pending: 'bg-muted',
};

function PlanCard({
  plan,
  visit,
  canStartSession,
  canAddSessions,
  onAddSessions,
  onOpenSession,
}: {
  plan: PatientTreatmentPlan;
  visit: Visit;
  canStartSession: boolean;
  canAddSessions: boolean;
  onAddSessions: (planId: number) => void;
  onOpenSession: (sessionId: number) => void;
}) {
  const procedures = [
    ...new Set(plan.sessions.map((session) => session.procedure).filter(Boolean)),
  ];
  const next = currentPlanSession(plan, visit);
  const startable = next && canStartSession && canStartPlanSession(plan, next, visit);

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Active Plan
          </p>
          <CardTitle className="text-lg">{plan.treatmentName}</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {plan.completedSessions} of {plan.totalSessions} completed
          </Badge>
          {canAddSessions ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-label={`Add Sessions to ${plan.treatmentName}`}
              onClick={() => onAddSessions(plan.id)}
            >
              <PiPlusLight className="size-4" />
              Add Sessions
            </Button>
          ) : null}
          {startable ? (
            <Button type="button" size="sm" onClick={() => onOpenSession(next.id)}>
              <CiPlay1 className="size-4" />
              Start Session {next.sessionNumber}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {procedures.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {procedures.map((procedure) => (
              // Imported procedures can be long descriptions: keep each badge inside the
              // card and show the full text on hover; the Session sheet shows it in full.
              <Badge
                key={procedure}
                variant="outline"
                className="max-w-full"
                title={procedure ?? undefined}
              >
                <span className="truncate">{procedure}</span>
              </Badge>
            ))}
          </div>
        ) : null}
        <div
          className="flex gap-1"
          role="img"
          aria-label={`${plan.completedSessions} of ${plan.totalSessions} Sessions completed`}
        >
          {plan.sessions.map((session) => {
            const label = planSessionLabel(session, visit);
            return (
              <span
                key={session.id}
                title={`Session ${session.sessionNumber}: ${label}`}
                className={cn('h-2.5 min-w-1 flex-1 rounded-sm', SEGMENT_TONE[label])}
              />
            );
          })}
        </div>
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(7.5rem,1fr))] gap-2">
          {plan.sessions.map((session) => {
            const label = planSessionLabel(session, visit);
            return (
              <button
                key={session.id}
                type="button"
                aria-label={`Session ${session.sessionNumber}, ${label}. View Session plan`}
                onClick={() => onOpenSession(session.id)}
                className={cn(
                  'hover:bg-accent focus-visible:ring-ring space-y-2 rounded-md border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                  session.id === next?.id && 'border-primary'
                )}
              >
                <p className="text-muted-foreground text-xs">Session {session.sessionNumber}</p>
                <Badge variant={label === 'Done' ? 'secondary' : 'outline'}>{label}</Badge>
                {session.procedure ? (
                  <p className="line-clamp-2 text-xs">{session.procedure}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Mirrors the panel once loaded: an active Visit shows a Plan card (heading, progress badge,
// segmented Session bar and Session tiles); a closed Visit shows its delivered Procedure cards.
function TreatmentPlansSkeleton({ activeVisit }: { activeVisit: boolean }) {
  if (!activeVisit) {
    return (
      <div className="space-y-3" aria-label="Loading Treatment Plans">
        <Skeleton className="h-6 w-72 max-w-full" />
        <div className="space-y-2 rounded-md border border-l-4 p-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>
    );
  }

  return (
    <Card aria-label="Loading Treatment Plans">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-6 w-28 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-36 rounded-full" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-sm" />
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(7.5rem,1fr))] gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="space-y-2 rounded-md border p-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function VisitTreatmentPlansPanel({ loading, error, ...props }: Props) {
  const activeVisit =
    props.visit.status === 'CHECKED_IN' || props.visit.status === 'IN_CONSULTATION';

  if (error && !loading) {
    return <p className="text-destructive text-sm">Treatment Plans could not be loaded.</p>;
  }

  return (
    <SkeletonCrossfade
      isLoading={loading}
      skeleton={<TreatmentPlansSkeleton activeVisit={activeVisit} />}
    >
      <TreatmentPlansContent {...props} />
    </SkeletonCrossfade>
  );
}

function TreatmentPlansContent({
  visit,
  plans,
  canAssignPlan,
  canBookAppointment,
  canStartSession,
  onAssignPlan,
  onAddSessions,
  onOpenSession,
}: Omit<Props, 'loading' | 'error'>) {
  const activePlans = plans.filter(isCurrentPlan);
  const completedPlans = plans.filter(
    (plan) => plan.status === 'COMPLETED' || plan.status === 'STOPPED'
  );
  const activeVisit = visit.status === 'CHECKED_IN' || visit.status === 'IN_CONSULTATION';

  // A closed Visit is a record of what happened then: show only the Plan Sessions it
  // started or completed, not the Patient's Plans as they stand today.
  if (!activeVisit) {
    const delivered = visitProcedures(visit, plans).filter((procedure) =>
      procedure.key.startsWith('plan-')
    );

    return delivered.length ? (
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Treatment Plan Sessions this Visit</h3>
        {delivered.map((procedure) => (
          <VisitProcedureCard key={procedure.key} procedure={procedure} />
        ))}
      </div>
    ) : (
      <EmptyState
        size="sm"
        tone="blue"
        title="No Sessions delivered"
        icon={PiClipboardTextDuotone}
        description="No Treatment Plan Sessions were delivered in this Visit."
      />
    );
  }

  return (
    <div className="space-y-5">
      {activePlans.length ? (
        activePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            visit={visit}
            canStartSession={canStartSession}
            canAddSessions={canAssignPlan}
            onAddSessions={onAddSessions}
            onOpenSession={onOpenSession}
          />
        ))
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              size="md"
              tone="blue"
              className="min-h-48"
              icon={PiClipboardTextDuotone}
              title="No active Patient Treatment Plan"
              description="Assign a Treatment to create Patient-specific Sessions."
            />
          </CardContent>
        </Card>
      )}

      {activeVisit && (canAssignPlan || canBookAppointment) ? (
        <div className="flex flex-wrap gap-2">
          {canBookAppointment && activePlans.length ? (
            <Button asChild>
              <Link href="/appointments/new">
                <PiCalendarPlusLight className="size-4" />
                Book next Session
              </Link>
            </Button>
          ) : null}
          {canAssignPlan ? (
            <Button
              type="button"
              variant={activePlans.length ? 'outline' : 'default'}
              onClick={onAssignPlan}
            >
              <PiClipboardTextLight className="size-4" />
              Assign Treatment Plan
            </Button>
          ) : null}
        </div>
      ) : null}

      {completedPlans.length ? (
        <Card className="gap-0">
          <CardHeader>
            <CardTitle className="text-base">
              Completed and stopped Plans <Badge variant="secondary">{completedPlans.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {completedPlans.map((plan) => (
                <li
                  key={plan.id}
                  className="flex flex-wrap items-center gap-3 border-t py-3 text-sm first:border-t-0"
                >
                  <span
                    className="bg-primary text-primary-foreground grid size-6 place-items-center rounded-full"
                    aria-hidden="true"
                  >
                    {plan.status === 'COMPLETED' ? (
                      <PiCheckLight className="size-3.5" />
                    ) : (
                      <PiXLight className="size-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 font-medium">{plan.treatmentName}</span>
                  <span className="text-muted-foreground">
                    {plan.completedSessions} / {plan.totalSessions} Sessions
                  </span>
                  <Badge variant="outline">{plan.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
