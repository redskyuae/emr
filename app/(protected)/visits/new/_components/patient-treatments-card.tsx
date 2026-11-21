import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import { PiArrowsCounterClockwiseLight, PiLeafLight } from 'react-icons/pi';

import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import {
  isCurrentTreatmentPlan,
  nextPlanSession,
  orderTreatmentPlans,
  treatmentPlanStatusLabel,
} from '../_utils/patient-treatment-history';
import { SectionHeading } from './section-heading';

/** Above this many Sessions a segmented bar gets too thin to read; use a plain bar. */
const MAX_SEGMENTED_SESSIONS = 14;

function SessionSegments({
  total,
  completed,
  hasNext,
}: {
  total: number;
  completed: number;
  hasNext: boolean;
}) {
  return (
    <div aria-hidden className="flex gap-1">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            'h-2 flex-1 rounded-full',
            index < completed
              ? 'bg-success'
              : hasNext && index === completed
                ? 'bg-primary ring-primary/20 ring-2'
                : 'bg-muted'
          )}
        />
      ))}
    </div>
  );
}

function PlanRow({
  plan,
  linkedBookingNumber,
}: {
  plan: PatientTreatmentPlan;
  linkedBookingNumber: string | null;
}) {
  const current = isCurrentTreatmentPlan(plan);
  const next = nextPlanSession(plan);
  const linkedToVisit = Boolean(
    next?.bookingNumber && linkedBookingNumber && next.bookingNumber === linkedBookingNumber
  );
  const progress = plan.totalSessions
    ? Math.round((plan.completedSessions / plan.totalSessions) * 100)
    : 0;

  return (
    <li
      className={cn(
        'space-y-3 rounded-lg border p-3',
        current ? 'bg-card' : 'bg-muted/30',
        linkedToVisit && 'border-primary/40 bg-accent/40'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-bold">{plan.treatmentName}</p>
          <p className="text-muted-foreground font-mono text-xs">{plan.treatmentCode}</p>
        </div>
        <Badge
          variant={current ? 'default' : 'outline'}
          className={current ? 'bg-success/10 text-success' : undefined}
        >
          {treatmentPlanStatusLabel(plan.status)}
        </Badge>
      </div>
      <div className="space-y-1.5">
        {plan.totalSessions <= MAX_SEGMENTED_SESSIONS ? (
          <SessionSegments
            total={plan.totalSessions}
            completed={plan.completedSessions}
            hasNext={Boolean(next)}
          />
        ) : (
          <Progress value={progress} aria-hidden />
        )}
        <p className="text-muted-foreground text-xs">
          {plan.completedSessions} of {plan.totalSessions} Sessions completed
        </p>
      </div>
      {next ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium">
            Next: Session {next.sessionNumber}
            {next.label ? ` · ${next.label}` : ''}
          </span>
          <Badge variant={next.state === 'Not booked' ? 'outline' : 'secondary'}>
            {next.bookingNumber ? `${next.state} · ${next.bookingNumber}` : next.state}
          </Badge>
          {linkedToVisit ? <Badge>This Visit</Badge> : null}
        </div>
      ) : null}
    </li>
  );
}

// Mirrors PlanRow: name and code beside the status badge, the Session bar and its count line.
function PlanListSkeleton() {
  return (
    <ul className="space-y-3" aria-label="Loading Treatment Plans">
      {Array.from({ length: 2 }, (_, index) => (
        <li key={index} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-40" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PatientTreatmentsCard({
  plans,
  loading,
  error,
  onRetry,
  linkedBookingNumber,
}: {
  /** The Patient's current (Pending or In progress) Plans. */
  plans: PatientTreatmentPlan[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  /** Booking number of the Appointment being checked in, to mark the Session it fulfils. */
  linkedBookingNumber: string | null;
}) {
  const orderedPlans = orderTreatmentPlans(plans);

  return (
    <Card>
      <CardHeader className="border-b">
        <SectionHeading
          icon={<PiLeafLight className="size-5" />}
          title="Treatment Plans"
          description={
            !loading && !error && plans.length
              ? `${plans.length} ongoing or not started`
              : 'Ongoing and not started treatments for this Patient'
          }
        />
      </CardHeader>
      <CardContent>
        {error && !loading ? (
          <div className="space-y-2">
            <p className="text-destructive text-sm">Treatment Plans could not be loaded.</p>
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              <PiArrowsCounterClockwiseLight className="size-4" />
              Retry
            </Button>
          </div>
        ) : (
          <SkeletonCrossfade isLoading={loading} skeleton={<PlanListSkeleton />}>
            {orderedPlans.length ? (
              <ul className="space-y-3">
                {orderedPlans.map((plan) => (
                  <PlanRow key={plan.id} plan={plan} linkedBookingNumber={linkedBookingNumber} />
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
                This Patient has no ongoing or not started Treatment Plans.
              </p>
            )}
          </SkeletonCrossfade>
        )}
      </CardContent>
    </Card>
  );
}
