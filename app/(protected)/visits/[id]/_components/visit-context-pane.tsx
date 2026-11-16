'use client';

import { Activity, ClipboardList, Leaf, Pill, ShieldAlert, type LucideIcon } from 'lucide-react';

import type { PatientChart } from '@/app/api/lib/modules/patient-chart/schemas/patient-chart-schema';
import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { usePatientTreatmentPlanHistoryQuery } from '@/app/queries/patient-treatment-plans/usePatientTreatmentPlans';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { currentPlanSession, isCurrentPlan } from '../_utils/visit-treatment-plan';
import { VisitPreviousVisits } from './visit-previous-visits';
import { VisitVitalTrends } from './visit-vital-trends';

function PaneSection({
  title,
  icon: Icon,
  tone,
  children,
}: {
  title: string;
  icon: LucideIcon;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
        <span
          aria-hidden="true"
          className={cn('grid size-6 shrink-0 place-items-center rounded-md', tone)}
        >
          <Icon className="size-3.5" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function PlanProgress({ plan, visit }: { plan: PatientTreatmentPlan; visit: Visit }) {
  const current = currentPlanSession(plan, visit);

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold [overflow-wrap:anywhere]">{plan.treatmentName}</p>
      <div
        role="img"
        aria-label={`${plan.completedSessions} of ${plan.totalSessions} Sessions completed`}
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${Math.max(plan.totalSessions, 1)}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: plan.totalSessions }, (_, index) => {
          const number = index + 1;
          const done = plan.sessions.some(
            (session) =>
              session.sessionNumber === number && session.completionStatus === 'COMPLETED'
          );
          const isCurrent = current?.sessionNumber === number && !done;

          return (
            <span
              key={number}
              className={cn(
                'h-1.5 rounded-sm',
                done ? 'bg-procedure' : isCurrent ? 'bg-procedure/35' : 'bg-muted'
              )}
            />
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">
        {plan.completedSessions} of {plan.totalSessions} done
        {current ? ` · Session ${current.sessionNumber} next` : ''}
      </p>
    </div>
  );
}

function SafetyList({
  title,
  icon,
  tone,
  items,
  loading,
}: {
  title: string;
  icon: LucideIcon;
  tone: string;
  items: { id: number; label: string; detail?: string | null }[];
  loading: boolean;
}) {
  return (
    <PaneSection title={`${title} (${loading ? '…' : items.length})`} icon={icon} tone={tone}>
      {loading ? (
        <Skeleton className="h-8 w-full" />
      ) : items.length ? (
        <ul className="space-y-1 text-sm">
          {items.map((item) => (
            <li key={item.id}>
              <span className="font-medium">{item.label}</span>
              {item.detail ? <span className="text-muted-foreground"> · {item.detail}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">None recorded.</p>
      )}
    </PaneSection>
  );
}

export function VisitContextPane({
  visit,
  chart,
  chartLoading,
  chartError,
  allergenName,
  className,
}: {
  visit: Visit;
  chart: PatientChart | undefined;
  chartLoading: boolean;
  chartError: boolean;
  allergenName: (id: number) => string;
  className?: string;
}) {
  const plansQuery = usePatientTreatmentPlanHistoryQuery(visit.patient.id);
  const { data: canReadPlan } = useHasPermission('patient-treatment-plan:read');
  const plans = (plansQuery.data ?? []).filter(isCurrentPlan);
  const allergies = (chart?.allergies ?? []).filter((item) => item.status === 'active');
  const problems = (chart?.problems ?? []).filter((item) => item.clinicalStatus === 'active');
  const medications = (chart?.medications ?? []).filter((item) => item.status === 'active');

  return (
    <aside
      aria-label="Patient context"
      className={cn('bg-card shadow-fluent-2 flex flex-col rounded-lg border', className)}
    >
      <Tabs defaultValue="trends" className="min-h-0 flex-1 gap-0">
        <div className="border-b p-1.5">
          <TabsList aria-label="Patient context" className="grid w-full grid-cols-2">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="history">Previous Visits</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="trends" className="space-y-5 p-4 xl:min-h-0 xl:overflow-y-auto">
          <PaneSection title="Vital Signs" icon={Activity} tone="bg-chart-4/12 text-chart-4">
            <VisitVitalTrends
              readings={chart?.vitalSigns ?? []}
              loading={chartLoading}
              error={chartError}
              emptyText="No Vital Signs recorded for this Patient."
            />
          </PaneSection>

          {canReadPlan && (plansQuery.isLoading || plans.length > 0) ? (
            <PaneSection title="Treatment Plan" icon={Leaf} tone="bg-procedure/10 text-procedure">
              {plansQuery.isLoading ? (
                <Skeleton className="h-12 w-full" aria-label="Loading Treatment Plans" />
              ) : (
                plans.map((plan) => <PlanProgress key={plan.id} plan={plan} visit={visit} />)
              )}
            </PaneSection>
          ) : null}

          {chartError ? (
            <p className="text-destructive text-sm">Safety records could not be loaded.</p>
          ) : (
            <>
              <SafetyList
                title="Allergies"
                icon={ShieldAlert}
                tone={
                  allergies.length
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground'
                }
                loading={chartLoading}
                items={allergies.map((allergy) => ({
                  id: allergy.id,
                  label:
                    allergy.substance ??
                    (allergy.allergenId ? allergenName(allergy.allergenId) : 'Allergen'),
                  detail: allergy.reaction,
                }))}
              />
              <SafetyList
                title="Active Problems"
                icon={ClipboardList}
                tone="bg-pop/10 text-pop"
                loading={chartLoading}
                items={problems.map((problem) => ({ id: problem.id, label: problem.title }))}
              />
              <SafetyList
                title="Current medications"
                icon={Pill}
                tone="bg-primary/10 text-primary"
                loading={chartLoading}
                items={medications.map((medication) => ({
                  id: medication.id,
                  label: medication.drugName,
                  detail: medication.dose,
                }))}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="p-3 xl:min-h-0 xl:overflow-y-auto">
          <VisitPreviousVisits
            visit={visit}
            notes={chart?.clinicalNotes ?? []}
            plans={canReadPlan ? (plansQuery.data ?? []) : []}
          />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
