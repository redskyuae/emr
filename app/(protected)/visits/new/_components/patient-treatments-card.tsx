import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import { ClipboardList, RefreshCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

import {
  isCurrentTreatmentPlan,
  nextPlanSession,
  orderTreatmentPlans,
  treatmentPlanStatusLabel,
} from '../_utils/patient-treatment-history';

function PlanRow({ plan }: { plan: PatientTreatmentPlan }) {
  const current = isCurrentTreatmentPlan(plan);
  const next = nextPlanSession(plan);
  const progress = plan.totalSessions
    ? Math.round((plan.completedSessions / plan.totalSessions) * 100)
    : 0;

  return (
    <li className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium">{plan.treatmentName}</p>
          <p className="text-muted-foreground font-mono text-xs">{plan.treatmentCode}</p>
        </div>
        <Badge variant={current ? 'default' : 'outline'}>
          {treatmentPlanStatusLabel(plan.status)}
        </Badge>
      </div>
      <div className="space-y-1">
        <Progress
          value={progress}
          aria-label={`${plan.treatmentName}: ${plan.completedSessions} of ${plan.totalSessions} Sessions completed`}
        />
        <p className="text-muted-foreground text-xs">
          {plan.completedSessions} of {plan.totalSessions} Sessions completed
        </p>
      </div>
      {next ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span>
            Next: Session {next.sessionNumber}
            {next.label ? ` · ${next.label}` : ''}
          </span>
          <Badge variant={next.state === 'Not booked' ? 'outline' : 'secondary'}>
            {next.bookingNumber ? `${next.state} · ${next.bookingNumber}` : next.state}
          </Badge>
        </div>
      ) : null}
    </li>
  );
}

export function PatientTreatmentsCard({
  plans,
  loading,
  error,
  onRetry,
}: {
  plans: PatientTreatmentPlan[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const orderedPlans = orderTreatmentPlans(plans);
  const currentCount = plans.filter(isCurrentTreatmentPlan).length;

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="text-primary size-4" />
          Treatment Plans
          {!loading && !error && plans.length ? (
            <Badge variant="secondary" className="rounded-full">
              {plans.length}
            </Badge>
          ) : null}
        </CardTitle>
        <CardDescription>
          {currentCount
            ? `${currentCount} current · ${plans.length - currentCount} in history`
            : 'Existing treatments for this Patient'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3" aria-label="Loading Treatment Plans">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-destructive text-sm">Treatment Plans could not be loaded.</p>
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              <RefreshCcw className="size-4" />
              Retry
            </Button>
          </div>
        ) : orderedPlans.length ? (
          <ul className="space-y-3">
            {orderedPlans.map((plan) => (
              <PlanRow key={plan.id} plan={plan} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            No Treatment Plans have been assigned to this Patient.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
