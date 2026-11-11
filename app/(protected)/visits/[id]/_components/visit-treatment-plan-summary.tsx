import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import {
  currentPlanSession,
  isCurrentPlan,
  planSessionLabel,
} from '../_utils/visit-treatment-plan';

function PlanRow({ plan, visit }: { plan: PatientTreatmentPlan; visit: Visit }) {
  const session = currentPlanSession(plan, visit);
  const label = session ? planSessionLabel(session, visit) : null;

  return (
    <li className="space-y-1 border-t pt-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{plan.treatmentName}</p>
        <Badge variant="secondary">
          {plan.completedSessions} of {plan.totalSessions} completed
        </Badge>
      </div>
      {session ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            Session {session.sessionNumber} of {plan.totalSessions}
            {session.label ? ` · ${session.label}` : ''}
          </span>
          <Badge variant="outline">{label === 'Pending' ? 'Next' : label}</Badge>
        </div>
      ) : null}
    </li>
  );
}

export function VisitTreatmentPlanSummary({
  visit,
  plans,
  loading,
  error,
}: {
  visit: Visit;
  plans: PatientTreatmentPlan[];
  loading: boolean;
  error: boolean;
}) {
  const currentPlans = plans.filter(isCurrentPlan);

  if (loading) {
    return <Skeleton className="h-24 w-full" aria-label="Loading Patient Treatment Plans" />;
  }

  if (error) {
    return <p className="text-destructive text-sm">Treatment Plans could not be loaded.</p>;
  }

  if (currentPlans.length === 0) return null;

  return (
    <Card className="shadow-fluent-2 gap-3">
      <CardHeader>
        <CardTitle className="text-base">Current Treatment Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {currentPlans.map((plan) => (
            <PlanRow key={plan.id} plan={plan} visit={visit} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
