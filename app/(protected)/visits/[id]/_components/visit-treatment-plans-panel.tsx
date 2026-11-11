import Link from 'next/link';
import { CalendarPlus, Check, ClipboardList, Play, X } from 'lucide-react';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

import {
  canStartPlanSession,
  currentPlanSession,
  isCurrentPlan,
  planSessionLabel,
} from '../_utils/visit-treatment-plan';

type Props = {
  visit: Visit;
  plans: PatientTreatmentPlan[];
  loading: boolean;
  error: boolean;
  canAssignPlan: boolean;
  canBookAppointment: boolean;
  canStartSession: boolean;
  onAssignPlan: () => void;
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
  onOpenSession,
}: {
  plan: PatientTreatmentPlan;
  visit: Visit;
  canStartSession: boolean;
  onOpenSession: (sessionId: number) => void;
}) {
  const procedures = [
    ...new Set(plan.sessions.map((session) => session.procedure).filter(Boolean)),
  ];
  const next = currentPlanSession(plan, visit);
  const startable = next && canStartSession && canStartPlanSession(plan, next, visit);

  return (
    <Card className="shadow-fluent-2">
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
          {startable ? (
            <Button type="button" size="sm" onClick={() => onOpenSession(next.id)}>
              <Play className="size-4" />
              Start Session {next.sessionNumber}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {procedures.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {procedures.map((procedure) => (
              <Badge key={procedure} variant="outline">
                {procedure}
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

export function VisitTreatmentPlansPanel({
  visit,
  plans,
  loading,
  error,
  canAssignPlan,
  canBookAppointment,
  canStartSession,
  onAssignPlan,
  onOpenSession,
}: Props) {
  const activePlans = plans.filter(isCurrentPlan);
  const completedPlans = plans.filter(
    (plan) => plan.status === 'COMPLETED' || plan.status === 'STOPPED'
  );
  const activeVisit = visit.status === 'CHECKED_IN' || visit.status === 'IN_CONSULTATION';

  if (loading)
    return (
      <Card className="shadow-fluent-2" aria-label="Loading Treatment Plans">
        <CardHeader className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  if (error)
    return <p className="text-destructive text-sm">Treatment Plans could not be loaded.</p>;

  return (
    <div className="space-y-5">
      {activePlans.length ? (
        activePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            visit={visit}
            canStartSession={canStartSession}
            onOpenSession={onOpenSession}
          />
        ))
      ) : (
        <Card className="shadow-fluent-2">
          <CardContent>
            <Empty className="min-h-48">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClipboardList className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No active Patient Treatment Plan</EmptyTitle>
                <EmptyDescription>
                  Assign a Treatment to create Patient-specific Sessions.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}

      {activeVisit && (canAssignPlan || canBookAppointment) ? (
        <div className="flex flex-wrap gap-2">
          {canBookAppointment && activePlans.length ? (
            <Button asChild>
              <Link href="/appointments/new">
                <CalendarPlus className="size-4" />
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
              <ClipboardList className="size-4" />
              Assign Treatment Plan
            </Button>
          ) : null}
        </div>
      ) : null}

      {completedPlans.length ? (
        <Card className="shadow-fluent-2 gap-0">
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
                      <Check className="size-3.5" />
                    ) : (
                      <X className="size-3.5" />
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
